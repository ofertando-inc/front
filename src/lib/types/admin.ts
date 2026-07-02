import type { ListOffersQuery, OfferStatus } from '$lib/types/offer';
import type { LocationResponse, MerchantResponse } from '$lib/types/merchant';
import type { ReportReason } from '$lib/types/report';
import type { AccountType, User, UserRole, UserStatus } from '$lib/types/auth';

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
	| 'id'
	| 'email'
	| 'username'
	| 'role'
	| 'accountType'
	| 'status'
	| 'reputation'
	| 'createdAt'
	| 'updatedAt'
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

export interface ModerationSummary {
	pendingComments: number;
	pendingOfferReports: number;
}

// Optional reason/note carried by moderation actions (verify, merge).
export interface ModerationActionBody {
	reason?: string;
	note?: string;
}

export interface MergeMerchantsDto extends ModerationActionBody {
	sourceId: string;
	targetId: string;
}

// Admin edits (only the supplied fields are changed).
export interface EditMerchantDto {
	name?: string;
}

export interface EditLocationDto {
	address?: string;
	city?: string;
	region?: string;
	latitude?: number;
	longitude?: number;
}

// Moderation listing filters for the merchant/location queues.
export interface AdminModerationListQuery {
	verified?: boolean;
	blocked?: boolean;
	q?: string;
	merchant?: string;
	cursor?: string;
	limit?: number;
}

export interface PaginatedMerchants {
	items: MerchantResponse[];
	nextCursor: string | null;
}

// A location with its owning merchant embedded for the admin queue.
export interface AdminLocation extends LocationResponse {
	merchant: { id: string; name: string };
}

export interface PaginatedAdminLocations {
	items: AdminLocation[];
	nextCursor: string | null;
}

// --- ROOT-only: account management ---

export interface AdminAccountsQuery {
	// Matches email or username.
	q?: string;
	role?: UserRole;
	accountType?: AccountType;
	cursor?: string;
	limit?: number;
}

// The password is provisional: the account holder is expected to change it.
export interface CreateAccountDto {
	email: string;
	username: string;
	password: string;
	accountType?: AccountType;
	role?: UserRole;
}

// Only the supplied fields change; `password` resets it, `status: 'DISABLED'`
// deactivates the account.
export interface UpdateAccountDto {
	email?: string;
	username?: string;
	password?: string;
	role?: UserRole;
	accountType?: AccountType;
	status?: UserStatus;
}

export interface PaginatedAccounts {
	items: PublicUser[];
	nextCursor: string | null;
}

// --- ROOT-only: merchant affiliation claims ---

export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ClaimResponse {
	id: string;
	status: ClaimStatus;
	note: string | null;
	createdAt: string;
	resolvedAt: string | null;
	// The business account asking for (or holding) the affiliation.
	user: { id: string; email: string; username: string };
	merchant: { id: string; name: string };
	// The ROOT admin who resolved the claim, null while pending.
	reviewedBy: { id: string; username: string } | null;
}

export interface AdminClaimsQuery {
	status?: ClaimStatus;
	cursor?: string;
	limit?: number;
}

// ROOT-created claims are approved immediately (the merchant gets its owner).
export interface CreateClaimDto {
	userId: string;
	merchantId: string;
	note?: string;
}

export interface PaginatedClaims {
	items: ClaimResponse[];
	nextCursor: string | null;
}
