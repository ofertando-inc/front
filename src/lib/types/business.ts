import type { ClaimStatus, PublicUser } from '$lib/types/admin';
import type { MerchantResponse } from '$lib/types/merchant';
import type { CreateOfferDto } from '$lib/types/offer';

// Summary of the approved claim binding the business to its merchant.
export interface BusinessClaimSummary {
	id: string;
	status: ClaimStatus;
	createdAt: string;
	resolvedAt: string | null;
}

// GET /business/me — only resolves for a BUSINESS account with an approved
// claim; otherwise 403 `account.not_business` / `account.no_affiliation`.
export interface BusinessMe {
	user: PublicUser;
	merchant: MerchantResponse;
	claim: BusinessClaimSummary;
}

export interface BusinessStats {
	offers: { total: number; active: number };
	// Sums of the offers' viewCount / clickCount.
	views: number;
	clicks: number;
	score: number;
	comments: number;
	reports: number;
}

// Official offers carry no merchant: the backend forces the affiliated one
// (sending merchantId/merchantName yields 400 validation.failed).
export type BusinessOfferDto = Omit<CreateOfferDto, 'merchantId' | 'merchantName'>;

// The created location enters the existing admin verification queue.
export interface RequestLocationDto {
	address: string;
	city: string;
	region?: string;
	latitude?: number;
	longitude?: number;
}
