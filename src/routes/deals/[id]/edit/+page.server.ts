import { error, redirect } from '@sveltejs/kit';
import { fail, superValidate } from 'sveltekit-superforms';
import {
	applyBackendErrors,
	offerFormAdapter,
	offerToFormData,
	readBackendError,
	requireAuthenticated
} from '$lib/server/offers/form';
import type { User } from '$lib/types/auth';
import type { Offer } from '$lib/types/offer';
import type { Actions, PageServerLoad } from './$types';

async function loadEditableOffer(eventFetch: typeof fetch, id: string, user: User): Promise<Offer> {
	const response = await eventFetch(`/api/offers/${encodeURIComponent(id)}`);

	if (response.status === 404) {
		throw error(404, 'Offer not found.');
	}

	if (!response.ok) {
		throw error(502, 'Unable to load the offer.');
	}

	const offer = (await response.json()) as Offer;

	if (offer.createdById !== user.id) {
		throw error(403, 'You cannot edit this offer.');
	}

	return offer;
}

export const load: PageServerLoad = async ({ fetch, params }) => {
	const user = await requireAuthenticated(fetch);
	const offer = await loadEditableOffer(fetch, params.id, user);

	return {
		offer,
		form: await superValidate(offerFormAdapter, {
			defaults: offerToFormData(offer)
		})
	};
};

export const actions: Actions = {
	default: async (event) => {
		const user = await requireAuthenticated(event.fetch);
		await loadEditableOffer(event.fetch, event.params.id, user);

		const form = await superValidate(event, offerFormAdapter);

		if (!form.valid) {
			return fail(400, { form });
		}

		const response = await event.fetch(`/api/offers/${encodeURIComponent(event.params.id)}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(form.data)
		});

		if (response.status === 401) {
			throw redirect(303, '/login');
		}

		if (response.status === 403) {
			throw error(403, 'You cannot edit this offer.');
		}

		if (!response.ok) {
			const payload = await readBackendError(response);
			return applyBackendErrors(form, payload, response.status, 'editDeal.genericError');
		}

		const offer = (await response.json()) as Offer;
		throw redirect(303, `/deals/${encodeURIComponent(offer.id)}`);
	}
};
