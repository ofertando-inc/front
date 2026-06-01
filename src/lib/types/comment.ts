import type { VoteType } from '$lib/types/vote';

export interface CommentResponse {
	id: string;
	content: string | null; // null when the comment is a deleted tombstone
	createdAt: string; // ISO 8601 UTC
	editedAt: string | null; // non-null once edited → show "(edited)"
	user: {
		id: string;
		username: string;
	};
	replyTo: { id: string; username: string } | null; // set when replying to a reply
	score: number; // net votes: (up) - (down), can be negative
	userVote: VoteType | null; // the viewer's vote (null if anonymous or not voted)
	replyCount: number; // live replies (relevant on roots)
	deleted: boolean; // true → tombstone "[deleted]"
}

export interface PaginatedComments {
	items: CommentResponse[];
	nextCursor: string | null;
}

export interface CreateCommentDto {
	content: string;
	parentId?: string;
}

export interface UpdateCommentDto {
	content: string;
}

export interface CommentVoteResponse {
	score: number;
	userVote: VoteType | null;
}
