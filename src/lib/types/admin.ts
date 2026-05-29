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
