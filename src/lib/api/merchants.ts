import { apiRequest } from '$lib/api/client';
import type { CreateMerchantDto, MerchantResponse } from '$lib/types/merchant';

function searchQuery(q?: string): string {
	if (!q) return '';
	const params = new URLSearchParams();
	params.set('q', q);
	return `?${params.toString()}`;
}

// Merchant referential search (verified first, then name A→Z, max 20). Only
// verified or already-used merchants surface, so orphans stay out of the list.
export function searchMerchants(q?: string) {
	return apiRequest<MerchantResponse[]>(`/merchants${searchQuery(q)}`, {
		method: 'GET'
	});
}

export function getMerchant(id: string) {
	return apiRequest<MerchantResponse>(`/merchants/${encodeURIComponent(id)}`, {
		method: 'GET'
	});
}

// Find-or-create by normalized name (always returned with `verified: false`).
// Requires auth.
export function createMerchant(payload: CreateMerchantDto) {
	return apiRequest<MerchantResponse>('/merchants', {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}
