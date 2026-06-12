import { describe, expect, it } from 'vitest';
import { isKnownCity, NATIONAL_CITY, normalizeCity, searchCities } from '$lib/offers/cities';

describe('cities', () => {
	it('normalizes accents and case to the canonical city name', () => {
		expect(normalizeCity('medellin')).toBe('Medellín');
		expect(normalizeCity('  MEDELLÍN ')).toBe('Medellín');
		expect(normalizeCity('bogota')).toBe('Bogotá');
	});

	it('returns null / false for an unknown city', () => {
		expect(normalizeCity('Gotham')).toBeNull();
		expect(isKnownCity('Gotham')).toBe(false);
		expect(isKnownCity('cali')).toBe(true);
	});

	it('searches by prefix first', () => {
		const results = searchCities('mede');
		expect(results.length).toBeGreaterThan(0);
		expect(results[0].name).toBe('Medellín');
		expect(results[0].department).toBeTruthy();
	});

	it('returns nothing for an empty query', () => {
		expect(searchCities('')).toEqual([]);
	});

	it('exposes the national sentinel for online offers', () => {
		expect(NATIONAL_CITY).toBe('Nacional');
	});
});
