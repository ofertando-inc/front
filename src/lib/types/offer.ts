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
	externalUrl: string | null;
	storeName: string;
	city: string;
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
	externalUrl?: string;
	storeName: string;
	city: string;
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
	store?: string;
	category?: string;
	offerType?: string;
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
	stores: FacetValue[];
	categories: CategoryFacet[];
}
