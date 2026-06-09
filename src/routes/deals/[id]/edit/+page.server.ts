import { redirect } from '@sveltejs/kit';
import { fail, superValidate } from 'sveltekit-superforms';
import { requireOwnedOffer } from '$lib/server/offers/access';
import {
	applyBackendErrors,
	fetchOfferCategories,
	offerFormAdapter,
	offerToFormData,
	readBackendError,
	requireAuthenticated
} from '$lib/server/offers/form';
import type { Offer } from '$lib/types/offer';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const user = await requireAuthenticated(fetch);
	const offer = await requireOwnedOffer(fetch, params.id, user);

	return {
		offer,
		categories: await fetchOfferCategories(fetch),
		form: await superValidate(offerFormAdapter, {
			defaults: offerToFormData(offer)
		})
	};
};

export const actions: Actions = {
	default: async (event) => {
		const user = await requireAuthenticated(event.fetch);
		await requireOwnedOffer(event.fetch, event.params.id, user);

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
			return applyBackendErrors(
				form,
				{ key: 'offer.forbidden' },
				response.status,
				'editDeal.genericError'
			);
		}

		if (!response.ok) {
			const payload = await readBackendError(response);
			return applyBackendErrors(form, payload, response.status, 'editDeal.genericError');
		}

		const offer = (await response.json()) as Offer;
		throw redirect(303, `/deals/${encodeURIComponent(offer.id)}`);
	}
};
