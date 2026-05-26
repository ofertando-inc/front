import { apiRequest } from '$lib/api/client';
import type { MyVoteResponse, OfferVoteResponse, VoteType } from '$lib/types/vote';

export function castVote(offerId: string, type: VoteType) {
	return apiRequest<OfferVoteResponse>(`/offers/${encodeURIComponent(offerId)}/votes`, {
		method: 'POST',
		body: JSON.stringify({ type })
	});
}

export function removeVote(offerId: string) {
	return apiRequest<OfferVoteResponse>(`/offers/${encodeURIComponent(offerId)}/votes`, {
		method: 'DELETE'
	});
}

export function getMyVote(offerId: string) {
	return apiRequest<MyVoteResponse>(`/offers/${encodeURIComponent(offerId)}/votes/me`, {
		method: 'GET'
	});
}
