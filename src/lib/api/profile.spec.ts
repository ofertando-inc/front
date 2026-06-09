import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMyComments, getMyVotes } from '$lib/api/profile';

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

describe('getMyComments', () => {
	it('GETs /users/me/comments with cursor pagination and credentials', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], nextCursor: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await getMyComments({ cursor: 'abc', limit: 20 });

		const url = fetchMock.mock.calls[0]?.[0] as string;
		expect(url).toContain('/users/me/comments?');
		expect(url).toContain('cursor=abc');
		expect(url).toContain('limit=20');
		expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'GET', credentials: 'include' });
	});
});

describe('getMyVotes', () => {
	it('GETs /users/me/votes with cursor pagination and credentials', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], nextCursor: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await getMyVotes({ limit: 50 });

		const url = fetchMock.mock.calls[0]?.[0] as string;
		expect(url).toContain('/users/me/votes?');
		expect(url).toContain('limit=50');
		expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'GET', credentials: 'include' });
	});
});
