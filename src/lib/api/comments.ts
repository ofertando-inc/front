import { apiRequest } from '$lib/api/client';
import type {
	CommentReportResponse,
	CommentResponse,
	CommentVoteResponse,
	CreateCommentDto,
	CreateCommentReportDto,
	MyCommentReportResponse,
	PaginatedComments,
	UpdateCommentDto
} from '$lib/types/comment';
import type { VoteType } from '$lib/types/vote';

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

export function voteComment(offerId: string, commentId: string, type: VoteType) {
	return apiRequest<CommentVoteResponse>(
		`/offers/${encodeURIComponent(offerId)}/comments/${encodeURIComponent(commentId)}/votes`,
		{ method: 'POST', body: JSON.stringify({ type }) }
	);
}

export function removeCommentVote(offerId: string, commentId: string) {
	return apiRequest<CommentVoteResponse>(
		`/offers/${encodeURIComponent(offerId)}/comments/${encodeURIComponent(commentId)}/votes`,
		{ method: 'DELETE' }
	);
}

export function reportComment(offerId: string, commentId: string, payload: CreateCommentReportDto) {
	return apiRequest<CommentReportResponse>(
		`/offers/${encodeURIComponent(offerId)}/comments/${encodeURIComponent(commentId)}/reports`,
		{ method: 'POST', body: JSON.stringify(payload) }
	);
}

export function getMyCommentReport(offerId: string, commentId: string) {
	return apiRequest<MyCommentReportResponse>(
		`/offers/${encodeURIComponent(offerId)}/comments/${encodeURIComponent(commentId)}/reports/me`,
		{ method: 'GET' }
	);
}
