import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '$lib/api/client';
import {
	createOffer,
	deleteOffer,
	getMyOffers,
	getOfferById,
	getOfferFacets,
	listOffers,
	updateOffer
} from '$lib/api/offers';
import type { CreateOfferDto } from '$lib/types/offer';

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

const validCreatePayload: CreateOfferDto = {
	title: 'Big discount',
	description: '50% off',
	offerType: 'discount',
	externalUrl: 'https://example.com/promo',
	storeName: 'Acme',
	city: 'Bogotá',
	startDate: '2026-05-18T00:00:00.000Z',
	endDate: '2026-05-25T00:00:00.000Z'
};

describe('listOffers', () => {
	it('calls /offers without a query string when no params are provided', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], nextCursor: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		const res = await listOffers();

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers`,
			expect.objectContaining({ method: 'GET', credentials: 'include' })
		);
		expect(res).toEqual({ items: [], nextCursor: null });
	});

	it('serializes every supported query param into the URL', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], nextCursor: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await listOffers({
			limit: 20,
			q: 'smart tv',
			sort: 'ending',
			period: 'week',
			city: 'Bogotá',
			store: 'Acme',
			category: 'technology',
			offerType: 'discount',
			includeExpired: false,
			cursor: 'abc'
		});

		const url = fetchMock.mock.calls[0]?.[0] as string;
		expect(url).toContain('cursor=abc');
		expect(url).toContain('limit=20');
		expect(url).toContain('q=smart+tv');
		expect(url).toContain('sort=ending');
		expect(url).toContain('period=week');
		expect(url).toContain('city=Bogot%C3%A1');
		expect(url).toContain('store=Acme');
		expect(url).toContain('category=technology');
		expect(url).toContain('offerType=discount');
		expect(url).toContain('includeExpired=false');
	});

	it('omits undefined params from the URL', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], nextCursor: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await listOffers({ sort: 'date' });

		expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/offers?sort=date`, expect.anything());
	});
});

describe('getMyOffers', () => {
	it('calls /offers/mine with credentials so the session cookie ships', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], nextCursor: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await getMyOffers();

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers/mine`,
			expect.objectContaining({
				method: 'GET',
				credentials: 'include'
			})
		);
	});

	it('forwards query params alongside the credentials', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], nextCursor: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await getMyOffers({ sort: 'date', limit: 10 });

		const url = fetchMock.mock.calls[0]?.[0] as string;
		expect(url).toContain('/offers/mine?');
		expect(url).toContain('sort=date');
		expect(url).toContain('limit=10');
	});
});

describe('getOfferFacets', () => {
	it('GETs /offers/facets with credentials and returns the facet buckets', async () => {
		const facets = {
			cities: [{ value: 'Bogotá', count: 12 }],
			stores: [{ value: 'Acme', count: 5 }],
			categories: [{ slug: 'technology', name: 'Technology', count: 8 }]
		};
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse(facets, 200));
		vi.stubGlobal('fetch', fetchMock);

		const res = await getOfferFacets();

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers/facets`,
			expect.objectContaining({ method: 'GET', credentials: 'include' })
		);
		expect(res).toEqual(facets);
	});
});

describe('getOfferById', () => {
	it('encodes the id in the URL', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse({ id: 'abc/def', title: 'Test' }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await getOfferById('abc/def');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers/abc%2Fdef`,
			expect.objectContaining({ method: 'GET' })
		);
	});

	it('throws an ApiError when the offer is not found', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse({ key: 'offer.not_found', statusCode: 404 }, 404))
		);

		await expect(getOfferById('missing')).rejects.toMatchObject({
			name: 'ApiError',
			key: 'offer.not_found',
			status: 404
		});
	});
});

describe('createOffer', () => {
	it('POSTs the JSON body with credentials', async () => {
		const created = { id: 'new', ...validCreatePayload };
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse(created, 201));
		vi.stubGlobal('fetch', fetchMock);

		const res = await createOffer(validCreatePayload);

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers`,
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				}),
				body: JSON.stringify(validCreatePayload)
			})
		);
		expect(res).toEqual(created);
	});

	it('propagates ApiError on invalid dates', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse({ key: 'offer.invalid_dates', statusCode: 400 }, 400))
		);

		await expect(createOffer(validCreatePayload)).rejects.toBeInstanceOf(ApiError);
	});
});

describe('updateOffer', () => {
	it('PATCHes the partial payload with credentials', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'abc', title: 'new' }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await updateOffer('abc', { title: 'new' });

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers/abc`,
			expect.objectContaining({
				method: 'PATCH',
				credentials: 'include',
				body: '{"title":"new"}'
			})
		);
	});
});

describe('deleteOffer', () => {
	it('DELETEs the offer with credentials and tolerates a 204 No Content', async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
		vi.stubGlobal('fetch', fetchMock);

		await expect(deleteOffer('abc')).resolves.toBeNull();

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers/abc`,
			expect.objectContaining({
				method: 'DELETE',
				credentials: 'include'
			})
		);
	});

	it('propagates ApiError on offer.forbidden', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse({ key: 'offer.forbidden', statusCode: 403 }, 403))
		);

		await expect(deleteOffer('abc')).rejects.toMatchObject({
			name: 'ApiError',
			key: 'offer.forbidden',
			status: 403
		});
	});
});
