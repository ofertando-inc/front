import { apiRequest } from '$lib/api/client';
import type {
	CreateOfferDto,
	ListOffersQuery,
	Offer,
	PaginatedOffers,
	UpdateOfferDto
} from '$lib/types/offer';

function buildQueryString(query?: ListOffersQuery): string {
	if (!query) return '';

	const params = new URLSearchParams();
	if (query.cursor !== undefined) params.set('cursor', query.cursor);
	if (query.limit !== undefined) params.set('limit', String(query.limit));
	if (query.sort !== undefined) params.set('sort', query.sort);
	if (query.period !== undefined) params.set('period', query.period);
	if (query.city !== undefined) params.set('city', query.city);
	if (query.offerType !== undefined) params.set('offerType', query.offerType);

	const serialized = params.toString();
	return serialized ? `?${serialized}` : '';
}

export function listOffers(query?: ListOffersQuery) {
	return apiRequest<PaginatedOffers>(`/offers${buildQueryString(query)}`, {
		method: 'GET'
	});
}

export function getMyOffers(query?: ListOffersQuery) {
	return apiRequest<PaginatedOffers>(`/offers/mine${buildQueryString(query)}`, {
		method: 'GET'
	});
}

export function getOfferById(id: string) {
	return apiRequest<Offer>(`/offers/${encodeURIComponent(id)}`, {
		method: 'GET'
	});
}

export function createOffer(payload: CreateOfferDto) {
	return apiRequest<Offer>('/offers', {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

export function updateOffer(id: string, payload: UpdateOfferDto) {
	return apiRequest<Offer>(`/offers/${encodeURIComponent(id)}`, {
		method: 'PATCH',
		body: JSON.stringify(payload)
	});
}

export function deleteOffer(id: string) {
	return apiRequest<void>(`/offers/${encodeURIComponent(id)}`, {
		method: 'DELETE'
	});
}
