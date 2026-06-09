import { apiRequest } from '$lib/api/client';
import type { MyActivityQuery, PaginatedMyComments, PaginatedMyVotes } from '$lib/types/profile';

function buildQueryString(query?: MyActivityQuery): string {
	if (!query) return '';

	const params = new URLSearchParams();
	if (query.cursor !== undefined) params.set('cursor', query.cursor);
	if (query.limit !== undefined) params.set('limit', String(query.limit));

	const serialized = params.toString();
	return serialized ? `?${serialized}` : '';
}

export function getMyComments(query?: MyActivityQuery) {
	return apiRequest<PaginatedMyComments>(`/users/me/comments${buildQueryString(query)}`, {
		method: 'GET'
	});
}

export function getMyVotes(query?: MyActivityQuery) {
	return apiRequest<PaginatedMyVotes>(`/users/me/votes${buildQueryString(query)}`, {
		method: 'GET'
	});
}
