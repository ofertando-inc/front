import citiesData from './colombia-cities.json';

export interface ColombianCity {
	name: string;
	department: string;
}

// ~1,100 Colombian municipios (DANE / community dataset), bundled so city
// lookup is instant and offline. Lazy-loaded with the offer form route.
export const COLOMBIAN_CITIES: ColombianCity[] = citiesData;

// Combining diacritical marks (U+0300–U+036F) left over after NFD normalization.
const DIACRITICS = /[̀-ͯ]/g;

// Accent- and case-insensitive folding so "mede", "MEDELLÍN" and "Medellin"
// all resolve to the same canonical city.
function fold(value: string): string {
	return value.normalize('NFD').replace(DIACRITICS, '').trim().toLowerCase();
}

const canonicalByFold = new Map<string, string>();
for (const city of COLOMBIAN_CITIES) {
	const key = fold(city.name);
	if (!canonicalByFold.has(key)) canonicalByFold.set(key, city.name);
}

/** Canonical city name for a free-text input, or null when it is unknown. */
export function normalizeCity(input: string): string | null {
	return canonicalByFold.get(fold(input)) ?? null;
}

export function isKnownCity(input: string): boolean {
	return canonicalByFold.has(fold(input));
}

/** Cities matching a query, prefix matches first, capped at `limit`. */
export function searchCities(query: string, limit = 8): ColombianCity[] {
	const q = fold(query);
	if (!q) return [];

	const starts: ColombianCity[] = [];
	const contains: ColombianCity[] = [];
	for (const city of COLOMBIAN_CITIES) {
		const folded = fold(city.name);
		if (folded.startsWith(q)) starts.push(city);
		else if (folded.includes(q)) contains.push(city);
	}

	return starts.concat(contains).slice(0, limit);
}
