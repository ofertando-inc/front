import { apiRequest } from '$lib/api/client';
import type {
	CommentResponse,
	CreateCommentDto,
	PaginatedComments,
	UpdateCommentDto
} from '$lib/types/comment';

export interface ListCommentsQuery {
	limit?: number;
	cursor?: string;
}

function buildCommentsQuery(query?: ListCommentsQuery): string {
	if (!query) return '';

	const params = new URLSearchParams();
	if (query.limit !== undefined) params.set('limit', String(query.limit));
	if (query.cursor !== undefined) params.set('cursor', query.cursor);

	const serialized = params.toString();
	return serialized ? `?${serialized}` : '';
}

export function listComments(offerId: string, query?: ListCommentsQuery) {
	return apiRequest<PaginatedComments>(
		`/offers/${encodeURIComponent(offerId)}/comments${buildCommentsQuery(query)}`,
		{ method: 'GET' }
	);
}

export function listReplies(offerId: string, commentId: string, query?: ListCommentsQuery) {
	return apiRequest<PaginatedComments>(
		`/offers/${encodeURIComponent(offerId)}/comments/${encodeURIComponent(commentId)}/replies${buildCommentsQuery(query)}`,
		{ method: 'GET' }
	);
}

export function createComment(offerId: string, payload: CreateCommentDto) {
	return apiRequest<CommentResponse>(`/offers/${encodeURIComponent(offerId)}/comments`, {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

export function updateComment(offerId: string, commentId: string, payload: UpdateCommentDto) {
	return apiRequest<CommentResponse>(
		`/offers/${encodeURIComponent(offerId)}/comments/${encodeURIComponent(commentId)}`,
		{ method: 'PATCH', body: JSON.stringify(payload) }
	);
}

export function deleteComment(offerId: string, commentId: string) {
	return apiRequest<CommentResponse>(
		`/offers/${encodeURIComponent(offerId)}/comments/${encodeURIComponent(commentId)}`,
		{ method: 'DELETE' }
	);
}
