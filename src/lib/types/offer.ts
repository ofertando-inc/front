import type { OfferLocation, OfferLocationInput, OfferMerchant } from '$lib/types/merchant';
import type { VoteType } from '$lib/types/vote';

export const OFFER_STATUSES = ['ACTIVE', 'REPORTED', 'DISABLED', 'DELETED', 'EXPIRED'] as const;
export const OFFER_SORTS = ['date', 'score', 'ending'] as const;
export const OFFER_PERIODS = ['all', 'day', 'week', 'month', 'year'] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];
export type OfferSort = (typeof OFFER_SORTS)[number];
export type OfferPeriod = (typeof OFFER_PERIODS)[number];

// Frozen category slugs shared with the backend seed. The front owns the
// localized label (i18n `categories` namespace keyed by slug); the slug is the
// stable join key, so an unknown slug falls back to the backend `name`.
export const CATEGORY_SLUGS = [
	'technology',
	'home',
	'fashion',
	'groceries',
	'restaurants',
	'travel',
	'entertainment',
	'beauty',
	'sports',
	'kids',
	'services',
	'other'
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

// Promotion nature (what kind of deal) — distinct from `isOnline` (where it
// applies). Free string ≤ 50 on the backend; the front offers a curated set and
// owns the localized labels (i18n `offerNature` namespace, keyed by value).
export const OFFER_NATURES = [
	'discount',
	'2x1',
	'coupon',
	'cashback',
	'clearance',
	'free_shipping',
	'other'
] as const;

export type OfferNature = (typeof OFFER_NATURES)[number];

export interface Category {
	id: string;
	slug: string;
	name: string;
	order: number;
}

// The lightweight shape embedded in each offer (no `order`).
export interface OfferCategory {
	id: string;
	slug: string;
	name: string;
}

export interface Offer {
	id: string;
	title: string;
	description: string;
	offerType: string;
	isOnline: boolean;
	externalUrl: string | null;
	// No offer-level city: the city lives on `location` (single source of truth).
	// Read `location.city` for a physical offer; online offers have no location.
	startDate: string;
	endDate: string;
	status: OfferStatus;
	score: number;
	reportCount: number;
	commentCount: number;
	createdAt: string;
	updatedAt: string;
	createdById: string;
	createdByUsername: string;
	userVote: VoteType | null;
	categories: OfferCategory[];
	merchant: OfferMerchant;
	location: OfferLocation | null;
}

export interface PaginatedOffers {
	items: Offer[];
	nextCursor: string | null;
	// CountedPaginatedResult: filtered total, independent of `limit`.
	total: number;
}

export interface CreateOfferDto {
	title: string;
	description: string;
	offerType: string;
	isOnline?: boolean;
	externalUrl?: string;
	// Merchant: an existing id, or a name to find-or-create (one is required).
	merchantId?: string;
	merchantName?: string;
	// Physical offers carry a location: an existing id, or a payload to
	// find-or-create under the merchant. Omitted entirely for online offers.
	locationId?: string;
	location?: OfferLocationInput;
	startDate: string;
	endDate: string;
	categoryIds: string[];
}

export type UpdateOfferDto = Partial<CreateOfferDto>;

export interface ListOffersQuery {
	cursor?: string;
	limit?: number;
	q?: string;
	sort?: OfferSort;
	period?: OfferPeriod;
	city?: string;
	merchant?: string;
	category?: string;
	online?: boolean;
	// "Near me": comma-joined "lat,lng" plus a radius in km. Online offers are
	// excluded server-side; an invalid pair yields `offer.invalid_near`.
	near?: string;
	radiusKm?: number;
	includeExpired?: boolean;
}

// Filter values computed by the backend over publicly listable offers
// (ACTIVE + EXPIRED), each carrying how many offers match it.
export interface FacetValue {
	value: string;
	count: number;
}

export interface CategoryFacet {
	slug: string;
	name: string;
	count: number;
}

export interface OfferFacets {
	cities: FacetValue[];
	categories: CategoryFacet[];
}
