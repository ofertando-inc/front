import { apiRequest } from '$lib/api/client';
import type { CreateReportDto, MyReportResponse, OfferReportResponse } from '$lib/types/report';

export function submitReport(offerId: string, payload: CreateReportDto) {
	return apiRequest<OfferReportResponse>(`/offers/${encodeURIComponent(offerId)}/reports`, {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

export function getMyReport(offerId: string) {
	return apiRequest<MyReportResponse>(`/offers/${encodeURIComponent(offerId)}/reports/me`, {
		method: 'GET'
	});
}
