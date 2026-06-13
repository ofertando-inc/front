import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createStore, geocode, getStore, searchStores } from '$lib/api/stores';
import type { CreateStoreDto } from '$lib/types/store';

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

describe('searchStores', () => {
	it('calls /stores without a query string when no term is given', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse([], 200));
		vi.stubGlobal('fetch', fetchMock);

		await searchStores();

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/stores`,
			expect.objectContaining({ method: 'GET', credentials: 'include' })
		);
	});

	it('encodes the search term into the query string', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse([], 200));
		vi.stubGlobal('fetch', fetchMock);

		await searchStores('Éxito centro');

		const url = fetchMock.mock.calls[0]?.[0] as string;
		expect(url).toContain('/stores?');
		expect(url).toContain('q=%C3%89xito+centro');
	});
});

describe('getStore', () => {
	it('encodes the id in the URL', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'a/b' }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await getStore('a/b');

		expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/stores/a%2Fb`, expect.anything());
	});
});

describe('createStore', () => {
	it('POSTs the store payload with credentials', async () => {
		const payload: CreateStoreDto = {
			name: 'Acme Store',
			city: 'Bogotá',
			region: 'Cundinamarca',
			address: 'Carrera 7 #1-23',
			latitude: 4.61,
			longitude: -74.08
		};
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 's1', verified: false }, 201));
		vi.stubGlobal('fetch', fetchMock);

		await createStore(payload);

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/stores`,
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				body: JSON.stringify(payload)
			})
		);
	});
});

describe('geocode', () => {
	it('GETs /stores/geocode with the encoded query and credentials', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse([], 200));
		vi.stubGlobal('fetch', fetchMock);

		await geocode('Carrera 7');

		const url = fetchMock.mock.calls[0]?.[0] as string;
		expect(url).toContain('/stores/geocode?');
		expect(url).toContain('q=Carrera+7');
		expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'GET', credentials: 'include' });
	});
});
