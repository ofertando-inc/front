import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCategories } from '$lib/api/categories';

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

describe('getCategories', () => {
	it('GETs /categories with credentials and returns the seeded list', async () => {
		const categories = [
			{ id: '1', slug: 'technology', name: 'Technology', order: 1 },
			{ id: '2', slug: 'home', name: 'Home', order: 2 }
		];
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse(categories, 200));
		vi.stubGlobal('fetch', fetchMock);

		const res = await getCategories();

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/categories`,
			expect.objectContaining({ method: 'GET', credentials: 'include' })
		);
		expect(res).toEqual(categories);
	});
});
