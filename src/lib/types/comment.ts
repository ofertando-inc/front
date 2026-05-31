export interface CommentResponse {
	id: string;
	content: string | null; // null when the comment is a deleted tombstone
	createdAt: string; // ISO 8601 UTC
	editedAt: string | null; // non-null once edited → show "(edited)"
	user: {
		id: string;
		username: string;
	};
	likeCount: number;
	replyCount: number; // live replies (relevant on roots)
	liked: boolean; // has the authenticated viewer liked it (false when anonymous)
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

export interface LikeResponse {
	likeCount: number;
	liked: boolean;
}
