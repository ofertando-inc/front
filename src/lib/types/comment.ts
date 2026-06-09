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
	deleted: boolean; // true → tombstone, removed by its author
	hidden: boolean; // true → tombstone, hidden by a moderator
}

export const COMMENT_REPORT_REASONS = [
	'SPAM',
	'ABUSE',
	'OFF_TOPIC',
	'MISINFORMATION',
	'OTHER'
] as const;

export type CommentReportReason = (typeof COMMENT_REPORT_REASONS)[number];

export interface CreateCommentReportDto {
	reason: CommentReportReason;
	note?: string;
}

export interface CommentReportResponse {
	reportCount: number;
}

export interface MyCommentReportResponse {
	reason: CommentReportReason | null;
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
