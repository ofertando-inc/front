import { redirect } from '@sveltejs/kit';
import { fail, superValidate } from 'sveltekit-superforms';
import { fetchBusinessMe, requireBusiness } from '$lib/server/business/guard';
import {
	applyBackendErrors,
	fetchOfferCategories,
	getDefaultOfferData,
	offerFormAdapter,
	readBackendError,
	toCreateOfferPayload
} from '$lib/server/offers/form';
import type { Offer } from '$lib/types/offer';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	await requireBusiness(fetch);

	// No approved affiliation yet: the dashboard shows the waiting banner.
	const businessMe = await fetchBusinessMe(fetch);
	if (!businessMe) {
		throw redirect(303, '/business');
	}

	return {
		merchantName: businessMe.merchant.name,
		categories: await fetchOfferCategories(fetch),
		form: await superValidate(offerFormAdapter, {
			// Prefill the imposed merchant so the shared schema validates; the
			// action strips it from the payload (the backend forces it anyway).
			defaults: { ...getDefaultOfferData(), merchantName: businessMe.merchant.name }
		})
	};
};

export const actions: Actions = {
	default: async (event) => {
		await requireBusiness(event.fetch);

		const form = await superValidate(event, offerFormAdapter);

		if (!form.valid) {
			return fail(400, { form });
		}

		// Official offers must NOT carry a merchant (400 validation.failed).
		const payload = toCreateOfferPayload(form.data);
		delete payload.merchantId;
		delete payload.merchantName;

		const response = await event.fetch('/api/business/offers', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		if (response.status === 401) {
			throw redirect(303, '/login');
		}

		if (response.status === 403) {
			throw redirect(303, '/business');
		}

		if (!response.ok) {
			const errorPayload = await readBackendError(response);
			return applyBackendErrors(form, errorPayload, response.status, 'createDeal.genericError');
		}

		const offer = (await response.json()) as Offer;
		throw redirect(303, `/deals/${encodeURIComponent(offer.id)}`);
	}
};
