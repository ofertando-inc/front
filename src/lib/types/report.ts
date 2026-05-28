import type { OfferStatus } from '$lib/types/offer';

export const REPORT_REASONS = [
	'EXPIRED',
	'UNAVAILABLE',
	'INCORRECT_INFO',
	'SCAM',
	'OTHER'
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export interface CreateReportDto {
	reason: ReportReason;
	comment?: string;
}

export interface OfferReportResponse {
	status: OfferStatus;
}

export interface MyReportResponse {
	reason: ReportReason | null;
}
