import { error } from '@sveltejs/kit';
import type { User } from '$lib/types/auth';
import type { Offer } from '$lib/types/offer';

interface OwnedOfferSuccess {
	ok: true;
	offer: Offer;
}

interface OwnedOfferFailure {
	ok: false;
	status: number;
	errorKey: string;
	message: string;
}

export type OwnedOfferResult = OwnedOfferSuccess | OwnedOfferFailure;

export async function getOwnedOffer(
	eventFetch: typeof fetch,
	id: string,
	user: User
): Promise<OwnedOfferResult> {
	const response = await eventFetch(`/api/offers/${encodeURIComponent(id)}`);

	if (response.status === 404) {
		return {
			ok: false,
			status: 404,
			errorKey: 'offer.not_found',
			message: 'Offer not found.'
		};
	}

	if (!response.ok) {
		return {
			ok: false,
			status: 502,
			errorKey: 'error.internal',
			message: 'Unable to load the offer.'
		};
	}

	const offer = (await response.json()) as Offer;

	if (offer.createdById !== user.id) {
		return {
			ok: false,
			status: 403,
			errorKey: 'offer.forbidden',
			message: 'You cannot modify this offer.'
		};
	}

	return { ok: true, offer };
}

export async function requireOwnedOffer(
	eventFetch: typeof fetch,
	id: string,
	user: User
): Promise<Offer> {
	const result = await getOwnedOffer(eventFetch, id, user);

	if (!result.ok) {
		throw error(result.status, result.message);
	}

	return result.offer;
}
