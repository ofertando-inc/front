import { apiRequest } from '$lib/api/client';
import type { Offer, PaginatedOffers } from '$lib/types/offer';
import type {
	AdminListOffersQuery,
	CommentModerationSummary,
	ModerationListQuery,
	ModerationSummary,
	PaginatedModerationComments,
	PaginatedReportDetails,
	PaginatedReports,
	PublicUser
} from '$lib/types/admin';

function buildCursorQuery(query?: ModerationListQuery): string {
	const params = new URLSearchParams();
	if (query?.cursor !== undefined) params.set('cursor', query.cursor);
	if (query?.limit !== undefined) params.set('limit', String(query.limit));
	const serialized = params.toString();
	return serialized ? `?${serialized}` : '';
}

function buildAdminOffersQuery(query?: AdminListOffersQuery): string {
	if (!query) return '';

	const params = new URLSearchParams();
	if (query.cursor !== undefined) params.set('cursor', query.cursor);
	if (query.limit !== undefined) params.set('limit', String(query.limit));
	if (query.sort !== undefined) params.set('sort', query.sort);
	if (query.period !== undefined) params.set('period', query.period);
	if (query.city !== undefined) params.set('city', query.city);
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

export function listAdminComments(query?: ModerationListQuery) {
	return apiRequest<PaginatedModerationComments>(`/admin/comments${buildCursorQuery(query)}`, {
		method: 'GET'
	});
}

export function hideComment(id: string) {
	return apiRequest<CommentModerationSummary>(`/admin/comments/${encodeURIComponent(id)}/hide`, {
		method: 'PATCH'
	});
}

export function dismissComment(id: string) {
	return apiRequest<CommentModerationSummary>(`/admin/comments/${encodeURIComponent(id)}/dismiss`, {
		method: 'PATCH'
	});
}

export function restoreComment(id: string) {
	return apiRequest<CommentModerationSummary>(`/admin/comments/${encodeURIComponent(id)}/restore`, {
		method: 'PATCH'
	});
}

export function listAdminCommentReports(id: string, query?: ModerationListQuery) {
	return apiRequest<PaginatedReportDetails>(
		`/admin/comments/${encodeURIComponent(id)}/reports${buildCursorQuery(query)}`,
		{ method: 'GET' }
	);
}

export function listAdminOfferReports(id: string, query?: ModerationListQuery) {
	return apiRequest<PaginatedReportDetails>(
		`/admin/offers/${encodeURIComponent(id)}/reports${buildCursorQuery(query)}`,
		{ method: 'GET' }
	);
}

export function dismissOffer(id: string) {
	return apiRequest<Offer>(`/admin/offers/${encodeURIComponent(id)}/dismiss`, {
		method: 'PATCH'
	});
}

export function getModerationSummary() {
	return apiRequest<ModerationSummary>('/admin/moderation/summary', { method: 'GET' });
}
