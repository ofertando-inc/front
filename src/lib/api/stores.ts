import { apiRequest } from '$lib/api/client';
import type { CreateStoreDto, GeocodeSuggestion, StoreResponse } from '$lib/types/store';

function searchQuery(q?: string): string {
	if (!q) return '';
	const params = new URLSearchParams();
	params.set('q', q);
	return `?${params.toString()}`;
}

// Store referential search (verified first, then name A→Z, max 20). Powers the
// store autocomplete on the offer form.
export function searchStores(q?: string) {
	return apiRequest<StoreResponse[]>(`/stores${searchQuery(q)}`, {
		method: 'GET'
	});
}

export function getStore(id: string) {
	return apiRequest<StoreResponse>(`/stores/${encodeURIComponent(id)}`, {
		method: 'GET'
	});
}

// Creates a store (always returned with `verified: false`). Requires auth.
export function createStore(payload: CreateStoreDto) {
	return apiRequest<StoreResponse>('/stores', {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

// Geocoding suggestions for a free-text query (≥ 3 chars). Requires auth;
// upstream failure surfaces as a `geocoding.unavailable` error.
export function geocode(q: string) {
	const params = new URLSearchParams();
	params.set('q', q);
	return apiRequest<GeocodeSuggestion[]>(`/stores/geocode?${params.toString()}`, {
		method: 'GET'
	});
}
