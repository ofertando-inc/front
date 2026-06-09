import type { ListOffersQuery, OfferStatus } from '$lib/types/offer';
import type { ReportReason } from '$lib/types/report';
import type { User } from '$lib/types/auth';

export interface AdminListOffersQuery extends ListOffersQuery {
	status?: OfferStatus;
}

export interface ReportSummary {
	id: string;
	reason: ReportReason;
	comment: string | null;
	createdAt: string;
	user: {
		id: string;
		username: string;
	};
	offer: {
		id: string;
		title: string;
	};
}

export interface PaginatedReports {
	items: ReportSummary[];
	nextCursor: string | null;
}

export type PublicUser = Pick<
	User,
	'id' | 'username' | 'role' | 'status' | 'createdAt' | 'updatedAt'
>;

export interface ModerationListQuery {
	cursor?: string;
	limit?: number;
}

export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface CommentModerationSummary {
	id: string;
	content: string;
	reportCount: number;
	hiddenAt: string | null;
	createdAt: string;
	user: { id: string; username: string };
	offer: { id: string; title: string };
}

export interface PaginatedModerationComments {
	items: CommentModerationSummary[];
	nextCursor: string | null;
}

export interface ReportDetail {
	id: string;
	reason: string; // comment or offer reason union, kept loose across both report types
	note: string | null;
	status: ReportStatus;
	createdAt: string;
	user: { id: string; username: string };
}

export interface PaginatedReportDetails {
	items: ReportDetail[];
	nextCursor: string | null;
}
