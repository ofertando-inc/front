import { error, redirect } from '@sveltejs/kit';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createOfferSchema, type CreateOfferFormData } from '$lib/validation/offerSchema';
import type { Offer } from '$lib/types/offer';
import type { Actions, PageServerLoad } from './$types';

const createOfferAdapter = zod4(createOfferSchema);
const offerFields = new Set<keyof CreateOfferFormData>([
	'title',
	'description',
	'offerType',
	'externalUrl',
	'storeName',
	'city',
	'startDate',
	'endDate'
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

function toDatetimeLocal(date: Date): string {
	const pad = (value: number) => String(value).padStart(2, '0');

	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
		date.getHours()
	)}:${pad(date.getMinutes())}`;
}

function getDefaultOfferData(): CreateOfferFormData {
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
		endDate: toDatetimeLocal(endDate)
	};
}

async function requireAuthenticated(eventFetch: typeof fetch) {
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
}

async function readBackendError(response: Response): Promise<BackendErrorPayload> {
	try {
		const payload = (await response.json()) as BackendErrorPayload;
		return payload && typeof payload === 'object' ? payload : {};
	} catch {
		return {};
	}
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

function getFormErrorKey(payload: BackendErrorPayload): string {
	if (typeof payload.key === 'string') return payload.key;
	if (typeof payload.message === 'string') return payload.message;
	return 'createDeal.genericError';
}

export const load: PageServerLoad = async ({ fetch }) => {
	await requireAuthenticated(fetch);

	return {
		form: await superValidate(createOfferAdapter, {
			defaults: getDefaultOfferData()
		})
	};
};

export const actions: Actions = {
	default: async (event) => {
		await requireAuthenticated(event.fetch);

		const form = await superValidate(event, createOfferAdapter);

		if (!form.valid) {
			return fail(400, { form });
		}

		const response = await event.fetch('/api/offers', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(form.data)
		});

		if (response.status === 401 || response.status === 403) {
			throw redirect(303, '/login');
		}

		if (!response.ok) {
			const payload = await readBackendError(response);
			const fieldError = getFirstFieldError(payload);

			if (fieldError) {
				form.valid = false;
				(form.errors as Record<string, string[]>)[fieldError.field] = [fieldError.constraint];
				return fail(response.status, { form });
			}

			form.valid = false;
			form.errors._errors = [getFormErrorKey(payload)];
			return fail(response.status, { form });
		}

		const offer = (await response.json()) as Offer;
		throw redirect(303, `/deals/${encodeURIComponent(offer.id)}`);
	}
};
