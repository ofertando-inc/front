// Merchant referential: a brand (e.g. "Éxito", "Amazon"), verifiable, shared by
// online and physical offers. A merchant owns 0..N physical `Location`s.
export interface MerchantResponse {
	id: string;
	name: string;
	verified: boolean;
	// ISO 8601 when the merchant was blocked by moderation, null when active.
	blockedAt: string | null;
	createdAt: string;
}

// A physical address belonging to a merchant (many per merchant), verifiable.
export interface LocationResponse {
	id: string;
	merchantId: string;
	address: string;
	city: string;
	region: string | null;
	latitude: number | null;
	longitude: number | null;
	verified: boolean;
	createdAt: string;
}

// A geocoding candidate from `GET /geocode` (Nominatim/OSM upstream, restricted
// to Colombia via `GEOCODING_COUNTRY_CODES`).
export interface GeocodeSuggestion {
	displayName: string;
	latitude: number;
	longitude: number;
	city: string | null;
	region: string | null;
	address: string | null;
}

// Lightweight merchant embedded in each offer (`OfferResponse.merchant`).
// `blocked` is derived server-side from the merchant's `blockedAt`.
export interface OfferMerchant {
	id: string;
	name: string;
	verified: boolean;
	blocked: boolean;
}

// Lightweight location embedded in a physical offer (`OfferResponse.location`).
export interface OfferLocation {
	id: string;
	address: string;
	city: string;
	region: string | null;
	latitude: number | null;
	longitude: number | null;
	verified: boolean;
}

export interface CreateMerchantDto {
	name: string;
}

// New-location payload sent inside a create/update offer for a physical deal.
// The backend find-or-creates the location under the offer's merchant.
export interface OfferLocationInput {
	address: string;
	city: string;
	region?: string;
	latitude?: number;
	longitude?: number;
}
