import type { VoteType } from '$lib/types/vote';

export interface MyCommentOffer {
	id: string;
	title: string;
}

// One of the viewer's own comments. Author-deleted comments are excluded by the
// backend; moderator-hidden ones stay with `hidden: true` and keep their content
// (the author is the one looking).
export interface MyComment {
	id: string;
	content: string;
	createdAt: string;
	editedAt: string | null;
	score: number;
	replyCount: number;
	hidden: boolean;
	offer: MyCommentOffer;
}

export interface PaginatedMyComments {
	items: MyComment[];
	nextCursor: string | null;
}

export interface MyVoteOffer {
	id: string;
	title: string;
	score: number;
}

// One of the viewer's votes. Votes on deleted offers are excluded by the backend.
export interface MyVote {
	type: VoteType;
	createdAt: string;
	offer: MyVoteOffer;
}

export interface PaginatedMyVotes {
	items: MyVote[];
	nextCursor: string | null;
}

export interface MyActivityQuery {
	cursor?: string;
	limit?: number;
}
