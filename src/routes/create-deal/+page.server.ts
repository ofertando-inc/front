import { redirect } from '@sveltejs/kit';
import { fail, superValidate } from 'sveltekit-superforms';
import {
	applyBackendErrors,
	getDefaultOfferData,
	offerFormAdapter,
	readBackendError,
	requireAuthenticated
} from '$lib/server/offers/form';
import type { Offer } from '$lib/types/offer';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	await requireAuthenticated(fetch);

	return {
		form: await superValidate(offerFormAdapter, {
			defaults: getDefaultOfferData()
		})
	};
};

export const actions: Actions = {
	default: async (event) => {
		await requireAuthenticated(event.fetch);

		const form = await superValidate(event, offerFormAdapter);

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
			return applyBackendErrors(form, payload, response.status, 'createDeal.genericError');
		}

		const offer = (await response.json()) as Offer;
		throw redirect(303, `/deals/${encodeURIComponent(offer.id)}`);
	}
};
