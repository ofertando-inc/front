import type { VoteType } from '$lib/types/vote';

export const OFFER_STATUSES = ['ACTIVE', 'REPORTED', 'DISABLED', 'DELETED', 'EXPIRED'] as const;
export const OFFER_SORTS = ['date', 'score'] as const;
export const OFFER_PERIODS = ['all', 'day', 'week', 'month', 'year'] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];
export type OfferSort = (typeof OFFER_SORTS)[number];
export type OfferPeriod = (typeof OFFER_PERIODS)[number];

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
	createdAt: string;
	updatedAt: string;
	createdById: string;
	createdByUsername: string;
	userVote: VoteType | null;
}

export interface PaginatedOffers {
	items: Offer[];
	nextCursor: string | null;
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
}

export type UpdateOfferDto = Partial<CreateOfferDto>;

export interface ListOffersQuery {
	cursor?: string;
	limit?: number;
	sort?: OfferSort;
	period?: OfferPeriod;
	city?: string;
	offerType?: string;
}
