import { apiRequest } from '$lib/api/client';
import type { Offer, PaginatedOffers } from '$lib/types/offer';
import type { AdminListOffersQuery, PaginatedReports, PublicUser } from '$lib/types/admin';

function buildAdminOffersQuery(query?: AdminListOffersQuery): string {
	if (!query) return '';

	const params = new URLSearchParams();
	if (query.cursor !== undefined) params.set('cursor', query.cursor);
	if (query.limit !== undefined) params.set('limit', String(query.limit));
	if (query.sort !== undefined) params.set('sort', query.sort);
	if (query.period !== undefined) params.set('period', query.period);
	if (query.city !== undefined) params.set('city', query.city);
	if (query.offerType !== undefined) params.set('offerType', query.offerType);
	if (query.status !== undefined) params.set('status', query.status);

	const serialized = params.toString();
	return serialized ? `?${serialized}` : '';
}

export function listAdminOffers(query?: AdminListOffersQuery) {
	return apiRequest<PaginatedOffers>(`/admin/offers${buildAdminOffersQuery(query)}`, {
		method: 'GET'
	});
}

export function disableOffer(id: string) {
	return apiRequest<Offer>(`/admin/offers/${encodeURIComponent(id)}/disable`, {
		method: 'PATCH'
	});
}

export function restoreOffer(id: string) {
	return apiRequest<Offer>(`/admin/offers/${encodeURIComponent(id)}/restore`, {
		method: 'PATCH'
	});
}

export function listAdminReports(query?: { cursor?: string; limit?: number }) {
	const params = new URLSearchParams();
	if (query?.cursor !== undefined) params.set('cursor', query.cursor);
	if (query?.limit !== undefined) params.set('limit', String(query.limit));
	const serialized = params.toString();

	return apiRequest<PaginatedReports>(`/admin/reports${serialized ? `?${serialized}` : ''}`, {
		method: 'GET'
	});
}

export function disableUser(id: string) {
	return apiRequest<PublicUser>(`/admin/users/${encodeURIComponent(id)}/disable`, {
		method: 'PATCH'
	});
}

export function restoreUser(id: string) {
	return apiRequest<PublicUser>(`/admin/users/${encodeURIComponent(id)}/restore`, {
		method: 'PATCH'
	});
}
