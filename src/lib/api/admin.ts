import { apiRequest } from '$lib/api/client';
import type { Offer, PaginatedOffers } from '$lib/types/offer';
import type { LocationResponse, MerchantResponse } from '$lib/types/merchant';
import type {
	AdminAccountsQuery,
	AdminClaimsQuery,
	AdminListOffersQuery,
	AdminModerationListQuery,
	ClaimResponse,
	CommentModerationSummary,
	CreateAccountDto,
	CreateClaimDto,
	EditLocationDto,
	EditMerchantDto,
	MergeMerchantsDto,
	ModerationActionBody,
	ModerationListQuery,
	ModerationSummary,
	PaginatedAccounts,
	PaginatedAdminLocations,
	PaginatedClaims,
	PaginatedMerchants,
	PaginatedModerationComments,
	PaginatedReportDetails,
	PaginatedReports,
	PublicUser,
	UpdateAccountDto
} from '$lib/types/admin';

function buildCursorQuery(query?: ModerationListQuery): string {
	const params = new URLSearchParams();
	if (query?.cursor !== undefined) params.set('cursor', query.cursor);
	if (query?.limit !== undefined) params.set('limit', String(query.limit));
	const serialized = params.toString();
	return serialized ? `?${serialized}` : '';
}

function buildAdminOffersQuery(query?: AdminListOffersQuery): string {
	if (!query) return '';

	const params = new URLSearchParams();
	if (query.cursor !== undefined) params.set('cursor', query.cursor);
	if (query.limit !== undefined) params.set('limit', String(query.limit));
	if (query.sort !== undefined) params.set('sort', query.sort);
	if (query.period !== undefined) params.set('period', query.period);
	if (query.city !== undefined) params.set('city', query.city);
	if (query.status !== undefined) params.set('status', query.status);

	const serialized = params.toString();
	return serialized ? `?${serialized}` : '';
}

export function listAdminOffers(query?: AdminListOffersQuery) {
	return apiRequest<PaginatedOffers>(`/admin/offers${buildAdminOffersQuery(query)}`, {
		method: 'GET'
	});
}

export function disableOffer(id: string) {
	return apiRequest<Offer>(`/admin/offers/${encodeURIComponent(id)}/disable`, {
		method: 'PATCH'
	});
}

export function restoreOffer(id: string) {
	return apiRequest<Offer>(`/admin/offers/${encodeURIComponent(id)}/restore`, {
		method: 'PATCH'
	});
}

export function listAdminReports(query?: { cursor?: string; limit?: number }) {
	const params = new URLSearchParams();
	if (query?.cursor !== undefined) params.set('cursor', query.cursor);
	if (query?.limit !== undefined) params.set('limit', String(query.limit));
	const serialized = params.toString();

	return apiRequest<PaginatedReports>(`/admin/reports${serialized ? `?${serialized}` : ''}`, {
		method: 'GET'
	});
}

export function disableUser(id: string) {
	return apiRequest<PublicUser>(`/admin/users/${encodeURIComponent(id)}/disable`, {
		method: 'PATCH'
	});
}

export function restoreUser(id: string) {
	return apiRequest<PublicUser>(`/admin/users/${encodeURIComponent(id)}/restore`, {
		method: 'PATCH'
	});
}

export function listAdminComments(query?: ModerationListQuery) {
	return apiRequest<PaginatedModerationComments>(`/admin/comments${buildCursorQuery(query)}`, {
		method: 'GET'
	});
}

export function hideComment(id: string) {
	return apiRequest<CommentModerationSummary>(`/admin/comments/${encodeURIComponent(id)}/hide`, {
		method: 'PATCH'
	});
}

export function dismissComment(id: string) {
	return apiRequest<CommentModerationSummary>(`/admin/comments/${encodeURIComponent(id)}/dismiss`, {
		method: 'PATCH'
	});
}

export function restoreComment(id: string) {
	return apiRequest<CommentModerationSummary>(`/admin/comments/${encodeURIComponent(id)}/restore`, {
		method: 'PATCH'
	});
}

export function listAdminCommentReports(id: string, query?: ModerationListQuery) {
	return apiRequest<PaginatedReportDetails>(
		`/admin/comments/${encodeURIComponent(id)}/reports${buildCursorQuery(query)}`,
		{ method: 'GET' }
	);
}

export function listAdminOfferReports(id: string, query?: ModerationListQuery) {
	return apiRequest<PaginatedReportDetails>(
		`/admin/offers/${encodeURIComponent(id)}/reports${buildCursorQuery(query)}`,
		{ method: 'GET' }
	);
}

export function dismissOffer(id: string) {
	return apiRequest<Offer>(`/admin/offers/${encodeURIComponent(id)}/dismiss`, {
		method: 'PATCH'
	});
}

export function getModerationSummary() {
	return apiRequest<ModerationSummary>('/admin/moderation/summary', { method: 'GET' });
}

function buildModerationListQuery(query?: AdminModerationListQuery): string {
	const params = new URLSearchParams();
	if (query?.verified !== undefined) params.set('verified', String(query.verified));
	if (query?.blocked !== undefined) params.set('blocked', String(query.blocked));
	if (query?.q !== undefined) params.set('q', query.q);
	if (query?.merchant !== undefined) params.set('merchant', query.merchant);
	if (query?.cursor !== undefined) params.set('cursor', query.cursor);
	if (query?.limit !== undefined) params.set('limit', String(query.limit));
	const serialized = params.toString();
	return serialized ? `?${serialized}` : '';
}

// Moderation queue of merchants (filter `verified=false` for the pending list).
export function listAdminMerchants(query?: AdminModerationListQuery) {
	return apiRequest<PaginatedMerchants>(`/admin/merchants${buildModerationListQuery(query)}`, {
		method: 'GET'
	});
}

// Moderation queue of locations (each item carries its owning merchant).
export function listAdminLocations(query?: AdminModerationListQuery) {
	return apiRequest<PaginatedAdminLocations>(`/admin/locations${buildModerationListQuery(query)}`, {
		method: 'GET'
	});
}

// Marks a merchant as verified. Optional reason/note are recorded by the backend.
export function verifyMerchant(id: string, body: ModerationActionBody = {}) {
	return apiRequest<MerchantResponse>(`/admin/merchants/${encodeURIComponent(id)}/verify`, {
		method: 'PATCH',
		body: JSON.stringify(body)
	});
}

// Marks a location as verified.
export function verifyLocation(id: string, body: ModerationActionBody = {}) {
	return apiRequest<LocationResponse>(`/admin/locations/${encodeURIComponent(id)}/verify`, {
		method: 'PATCH',
		body: JSON.stringify(body)
	});
}

// Merges a duplicate merchant (source) into the target: the backend moves the
// source's locations and offers, then deletes it. Returns the kept merchant.
export function mergeMerchants(payload: MergeMerchantsDto) {
	return apiRequest<MerchantResponse>('/admin/merchants/merge', {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

// Renames a merchant. `merchant.name_taken` (400) means another merchant already
// owns the name — the admin should merge instead.
export function editMerchant(id: string, payload: EditMerchantDto) {
	return apiRequest<MerchantResponse>(`/admin/merchants/${encodeURIComponent(id)}`, {
		method: 'PATCH',
		body: JSON.stringify(payload)
	});
}

// Blocks a merchant: its offers drop out of the public lists (derived from
// `blockedAt`). Optional reason/note are recorded.
export function blockMerchant(id: string, body: ModerationActionBody = {}) {
	return apiRequest<MerchantResponse>(`/admin/merchants/${encodeURIComponent(id)}/block`, {
		method: 'POST',
		body: JSON.stringify(body)
	});
}

export function unblockMerchant(id: string, body: ModerationActionBody = {}) {
	return apiRequest<MerchantResponse>(`/admin/merchants/${encodeURIComponent(id)}/unblock`, {
		method: 'POST',
		body: JSON.stringify(body)
	});
}

// Edits a location (only the supplied fields change). Changing the city resyncs
// the denormalized city of its offers server-side.
export function editLocation(id: string, payload: EditLocationDto) {
	return apiRequest<LocationResponse>(`/admin/locations/${encodeURIComponent(id)}`, {
		method: 'PATCH',
		body: JSON.stringify(payload)
	});
}

// Deletes a location. With attached offers it yields `location.in_use` (409)
// unless `reassignTo` (another address of the same merchant) is provided, in
// which case the offers move there first.
export function deleteLocation(id: string, reassignTo?: string) {
	const query = reassignTo ? `?reassignTo=${encodeURIComponent(reassignTo)}` : '';
	return apiRequest<void>(`/admin/locations/${encodeURIComponent(id)}${query}`, {
		method: 'DELETE'
	});
}

// --- ROOT-only endpoints (403 auth.forbidden_root for a plain ADMIN) ---

function buildAccountsQuery(query?: AdminAccountsQuery): string {
	const params = new URLSearchParams();
	if (query?.q !== undefined) params.set('q', query.q);
	if (query?.role !== undefined) params.set('role', query.role);
	if (query?.accountType !== undefined) params.set('accountType', query.accountType);
	if (query?.cursor !== undefined) params.set('cursor', query.cursor);
	if (query?.limit !== undefined) params.set('limit', String(query.limit));
	const serialized = params.toString();
	return serialized ? `?${serialized}` : '';
}

// Newest accounts first. `q` matches email or username.
export function listAccounts(query?: AdminAccountsQuery) {
	return apiRequest<PaginatedAccounts>(`/admin/accounts${buildAccountsQuery(query)}`, {
		method: 'GET'
	});
}

// Business accounts are only born here — there is no self-signup for them.
export function createAccount(payload: CreateAccountDto) {
	return apiRequest<PublicUser>('/admin/accounts', {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

export function updateAccount(id: string, payload: UpdateAccountDto) {
	return apiRequest<PublicUser>(`/admin/accounts/${encodeURIComponent(id)}`, {
		method: 'PATCH',
		body: JSON.stringify(payload)
	});
}

function buildClaimsQuery(query?: AdminClaimsQuery): string {
	const params = new URLSearchParams();
	if (query?.status !== undefined) params.set('status', query.status);
	if (query?.cursor !== undefined) params.set('cursor', query.cursor);
	if (query?.limit !== undefined) params.set('limit', String(query.limit));
	const serialized = params.toString();
	return serialized ? `?${serialized}` : '';
}

// `status: 'PENDING'` is the validation queue.
export function listClaims(query?: AdminClaimsQuery) {
	return apiRequest<PaginatedClaims>(`/admin/claims${buildClaimsQuery(query)}`, {
		method: 'GET'
	});
}

// ROOT-created claims are approved on the spot: the merchant gets its owner.
export function createClaim(payload: CreateClaimDto) {
	return apiRequest<ClaimResponse>('/admin/claims', {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

export function approveClaim(id: string, body: ModerationActionBody = {}) {
	return apiRequest<ClaimResponse>(`/admin/claims/${encodeURIComponent(id)}/approve`, {
		method: 'PATCH',
		body: JSON.stringify(body)
	});
}

// The note is stored on the rejected claim so the business can see the reason.
export function rejectClaim(id: string, body: ModerationActionBody = {}) {
	return apiRequest<ClaimResponse>(`/admin/claims/${encodeURIComponent(id)}/reject`, {
		method: 'PATCH',
		body: JSON.stringify(body)
	});
}
