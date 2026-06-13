// Full store record returned by the /stores endpoints.
export interface StoreResponse {
	id: string;
	name: string;
	city: string;
	region: string | null;
	address: string | null;
	latitude: number | null;
	longitude: number | null;
	verified: boolean;
	createdAt: string;
}

// Lightweight store embedded in each offer (`OfferResponse.store`).
export interface OfferStore {
	id: string;
	name: string;
	city: string;
	verified: boolean;
	latitude: number | null;
	longitude: number | null;
}

// A geocoding candidate from `/stores/geocode` (Nominatim/OSM upstream).
export interface GeocodeSuggestion {
	displayName: string;
	latitude: number;
	longitude: number;
	city: string | null;
	region: string | null;
	address: string | null;
}

export interface CreateStoreDto {
	name: string;
	city: string;
	region?: string;
	address?: string;
	latitude?: number;
	longitude?: number;
}
