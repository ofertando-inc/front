import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createBusinessOffer,
	getBusinessMe,
	getBusinessStats,
	requestLocation
} from '$lib/api/business';
import type { BusinessOfferDto } from '$lib/types/business';

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

describe('getBusinessMe', () => {
	it('GETs the business profile with credentials', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ user: { id: 'u1' } }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await getBusinessMe();

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/business/me`,
			expect.objectContaining({ method: 'GET', credentials: 'include' })
		);
	});

	it('propagates account.no_affiliation while the claim is pending', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue(jsonResponse({ key: 'account.no_affiliation', statusCode: 403 }, 403))
		);

		await expect(getBusinessMe()).rejects.toMatchObject({
			name: 'ApiError',
			key: 'account.no_affiliation',
			status: 403
		});
	});
});

describe('getBusinessStats', () => {
	it('GETs the stats', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse({ offers: { total: 4, active: 3 }, views: 10 }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await getBusinessStats();

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/business/stats`,
			expect.objectContaining({ method: 'GET' })
		);
	});
});

describe('createBusinessOffer', () => {
	it('POSTs the merchant-less payload to /business/offers', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'o1', official: true }, 201));
		vi.stubGlobal('fetch', fetchMock);

		const payload: BusinessOfferDto = {
			title: 'Oferta oficial',
			description: 'Descripción suficientemente larga.',
			offerType: 'discount',
			isOnline: true,
			externalUrl: 'https://example.com/promo',
			startDate: '2026-07-01T00:00:00.000Z',
			endDate: '2026-07-31T00:00:00.000Z',
			categoryIds: ['cat-1']
		};
		await createBusinessOffer(payload);

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/business/offers`,
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				body: JSON.stringify(payload)
			})
		);
	});
});

describe('requestLocation', () => {
	it('POSTs the address request', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'l1', verified: false }, 201));
		vi.stubGlobal('fetch', fetchMock);

		const payload = {
			address: 'Calle 10 #20-30',
			city: 'Bogotá',
			latitude: 4.6,
			longitude: -74.08
		};
		await requestLocation(payload);

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/business/locations`,
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				body: JSON.stringify(payload)
			})
		);
	});

	it('propagates account.not_business for individual accounts', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse({ key: 'account.not_business', statusCode: 403 }, 403))
		);

		await expect(requestLocation({ address: 'Calle 1', city: 'Cali' })).rejects.toMatchObject({
			name: 'ApiError',
			key: 'account.not_business',
			status: 403
		});
	});
});
