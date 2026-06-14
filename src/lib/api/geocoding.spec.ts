import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { geocode, reverseGeocode } from '$lib/api/geocoding';

const BASE_URL = 'http://test.local';

beforeEach(() => {
	vi.stubEnv('PUBLIC_API_URL', BASE_URL);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
});

function jsonResponse(body: unknown, status: number) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

describe('geocode', () => {
	it('encodes the q parameter on /geocode', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse([], 200));
		vi.stubGlobal('fetch', fetchMock);

		await geocode('Calle 10 #20-30, Bogotá');

		const url = fetchMock.mock.calls[0]?.[0] as string;
		expect(url).toContain('/geocode?q=');
		expect(url).toContain('Bogot%C3%A1');
	});

	it('propagates an ApiError when geocoding is unavailable', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue(jsonResponse({ key: 'geocoding.unavailable', statusCode: 502 }, 502))
		);

		await expect(geocode('whatever')).rejects.toMatchObject({
			name: 'ApiError',
			key: 'geocoding.unavailable',
			status: 502
		});
	});
});

describe('reverseGeocode', () => {
	it('encodes lat and lng on /geocode/reverse', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse(null, 200));
		vi.stubGlobal('fetch', fetchMock);

		await reverseGeocode(4.6, -74.08);

		const url = fetchMock.mock.calls[0]?.[0] as string;
		expect(url).toContain('/geocode/reverse?');
		expect(url).toContain('lat=4.6');
		expect(url).toContain('lng=-74.08');
	});
});
