export const VOTE_TYPES = ['UP', 'DOWN'] as const;

export type VoteType = (typeof VOTE_TYPES)[number];

export interface OfferVoteResponse {
	score: number;
	userVote: VoteType | null;
}

export interface MyVoteResponse {
	type: VoteType | null;
}
