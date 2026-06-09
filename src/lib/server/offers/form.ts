import { error, redirect } from '@sveltejs/kit';
import { fail, type SuperValidated } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createOfferSchema, type CreateOfferFormData } from '$lib/validation/offerSchema';
import type { User } from '$lib/types/auth';
import type { Category, Offer } from '$lib/types/offer';

export const offerFormAdapter = zod4(createOfferSchema);

const offerFields = new Set<keyof CreateOfferFormData>([
	'title',
	'description',
	'offerType',
	'externalUrl',
	'storeName',
	'city',
	'startDate',
	'endDate',
	'categoryIds'
]);

interface BackendErrorPayload {
	key?: unknown;
	message?: unknown;
	details?: unknown;
}

interface BackendFieldError {
	field: keyof CreateOfferFormData;
	constraint: string;
}

export function toDatetimeLocal(date: Date): string {
	const pad = (value: number) => String(value).padStart(2, '0');

	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
		date.getHours()
	)}:${pad(date.getMinutes())}`;
}

export function getDefaultOfferData(): CreateOfferFormData {
	const startDate = new Date(Date.now() + 60 * 60 * 1000);
	const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

	return {
		title: '',
		description: '',
		offerType: 'online',
		externalUrl: '',
		storeName: '',
		city: '',
		startDate: toDatetimeLocal(startDate),
		endDate: toDatetimeLocal(endDate),
		categoryIds: []
	};
}

export function offerToFormData(offer: Offer): CreateOfferFormData {
	return {
		title: offer.title,
		description: offer.description,
		offerType: offer.offerType,
		externalUrl: offer.externalUrl ?? '',
		storeName: offer.storeName,
		city: offer.city,
		startDate: toDatetimeLocal(new Date(offer.startDate)),
		endDate: toDatetimeLocal(new Date(offer.endDate)),
		categoryIds: offer.categories.map((category) => category.id)
	};
}

export async function fetchOfferCategories(eventFetch: typeof fetch): Promise<Category[]> {
	try {
		const response = await eventFetch('/api/categories');
		if (!response.ok) return [];
		return (await response.json()) as Category[];
	} catch {
		return [];
	}
}

export async function requireAuthenticated(eventFetch: typeof fetch): Promise<User> {
	let response = await eventFetch('/api/users/me');

	if (response.status === 401) {
		const refreshResponse = await eventFetch('/api/auth/refresh', { method: 'POST' });
		if (refreshResponse.ok) {
			response = await eventFetch('/api/users/me');
		}
	}

	if (response.status === 401 || response.status === 403) {
		throw redirect(303, '/login');
	}

	if (!response.ok) {
		throw error(502, 'Unable to verify the current session.');
	}

	return (await response.json()) as User;
}

export async function readBackendError(response: Response): Promise<BackendErrorPayload> {
	try {
		const payload = (await response.json()) as BackendErrorPayload;
		return payload && typeof payload === 'object' ? payload : {};
	} catch {
		return {};
	}
}

export function applyBackendErrors(
	form: SuperValidated<CreateOfferFormData>,
	payload: BackendErrorPayload,
	status: number,
	genericErrorKey: string
) {
	const fieldError = getFirstFieldError(payload);

	if (fieldError) {
		form.valid = false;
		(form.errors as Record<string, string[]>)[fieldError.field] = [fieldError.constraint];
		return fail(status, { form });
	}

	form.valid = false;
	form.errors._errors = [getFormErrorKey(payload, genericErrorKey)];
	return fail(status, { form });
}

function getFirstFieldError(payload: BackendErrorPayload): BackendFieldError | null {
	if (!payload.details || typeof payload.details !== 'object') return null;

	const fields = (payload.details as { fields?: unknown }).fields;
	if (!Array.isArray(fields)) return null;

	for (const item of fields) {
		if (!item || typeof item !== 'object') continue;

		const { field, constraints } = item as { field?: unknown; constraints?: unknown };
		const constraint = Array.isArray(constraints) ? constraints[0] : undefined;

		if (typeof field === 'string' && offerFields.has(field as keyof CreateOfferFormData)) {
			return {
				field: field as keyof CreateOfferFormData,
				constraint: typeof constraint === 'string' ? constraint : 'isNotEmpty'
			};
		}
	}

	return null;
}

function getFormErrorKey(payload: BackendErrorPayload, genericErrorKey: string): string {
	if (typeof payload.key === 'string') return payload.key;
	if (typeof payload.message === 'string') return payload.message;
	return genericErrorKey;
}
