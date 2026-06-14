import { apiRequest } from '$lib/api/client';
import type { GeocodeSuggestion } from '$lib/types/merchant';

// Geocoding suggestions for a free-text query (≥ 3 chars), restricted to
// Colombia upstream. Requires auth; an upstream failure surfaces as a
// `geocoding.unavailable` error.
export function geocode(q: string) {
	const params = new URLSearchParams();
	params.set('q', q);
	return apiRequest<GeocodeSuggestion[]>(`/geocode?${params.toString()}`, {
		method: 'GET'
	});
}

// Reverse geocoding for a map point — used to refresh the city/region when the
// pin is dragged. Requires auth; may resolve to null when nothing is found.
export function reverseGeocode(latitude: number, longitude: number) {
	const params = new URLSearchParams();
	params.set('lat', String(latitude));
	params.set('lng', String(longitude));
	return apiRequest<GeocodeSuggestion | null>(`/geocode/reverse?${params.toString()}`, {
		method: 'GET'
	});
}
