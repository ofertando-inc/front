import { apiRequest } from '$lib/api/client';
import type {
	BusinessMe,
	BusinessOfferDto,
	BusinessStats,
	RequestLocationDto
} from '$lib/types/business';
import type { LocationResponse } from '$lib/types/merchant';
import type { Offer } from '$lib/types/offer';

export function getBusinessMe() {
	return apiRequest<BusinessMe>('/business/me', { method: 'GET' });
}

export function getBusinessStats() {
	return apiRequest<BusinessStats>('/business/stats', { method: 'GET' });
}

// Publishes an official offer: the merchant is forced server-side to the
// affiliated one and the response carries `official: true`.
export function createBusinessOffer(payload: BusinessOfferDto) {
	return apiRequest<Offer>('/business/offers', {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

// Requests a new address for the affiliated merchant; it comes back
// unverified and waits in the admin verification queue.
export function requestLocation(payload: RequestLocationDto) {
	return apiRequest<LocationResponse>('/business/locations', {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}
