import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '$lib/api/client';
import { castVote, getMyVote, removeVote } from '$lib/api/votes';

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

describe('castVote', () => {
	it('POSTs the type payload with credentials', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ score: 5, userVote: 'UP' }, 200));
		vi.stubGlobal('fetch', fetchMock);

		const res = await castVote('abc', 'UP');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers/abc/votes`,
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
				body: JSON.stringify({ type: 'UP' })
			})
		);
		expect(res).toEqual({ score: 5, userVote: 'UP' });
	});

	it('encodes the offer id in the URL', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ score: 1, userVote: 'DOWN' }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await castVote('abc/def', 'DOWN');

		expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/offers/abc%2Fdef/votes`, expect.anything());
	});

	it('propagates ApiError on vote.offer_not_voteable', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue(jsonResponse({ key: 'vote.offer_not_voteable', statusCode: 400 }, 400))
		);

		await expect(castVote('abc', 'UP')).rejects.toMatchObject({
			name: 'ApiError',
			key: 'vote.offer_not_voteable',
			status: 400
		});
	});

	it('propagates ApiError on auth.unauthorized', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse({ key: 'auth.unauthorized', statusCode: 401 }, 401))
		);

		await expect(castVote('abc', 'UP')).rejects.toBeInstanceOf(ApiError);
	});
});

describe('removeVote', () => {
	it('DELETEs the vote with credentials', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ score: 4, userVote: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		const res = await removeVote('abc');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers/abc/votes`,
			expect.objectContaining({
				method: 'DELETE',
				credentials: 'include'
			})
		);
		expect(res).toEqual({ score: 4, userVote: null });
	});

	it('encodes the offer id in the URL', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ score: 0, userVote: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await removeVote('abc/def');

		expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/offers/abc%2Fdef/votes`, expect.anything());
	});
});

describe('getMyVote', () => {
	it('GETs the current user vote with credentials', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ type: 'UP' }, 200));
		vi.stubGlobal('fetch', fetchMock);

		const res = await getMyVote('abc');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers/abc/votes/me`,
			expect.objectContaining({
				method: 'GET',
				credentials: 'include'
			})
		);
		expect(res).toEqual({ type: 'UP' });
	});

	it('returns null when the user has not voted', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ type: null }, 200)));

		await expect(getMyVote('abc')).resolves.toEqual({ type: null });
	});

	it('encodes the offer id in the URL', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ type: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await getMyVote('abc/def');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers/abc%2Fdef/votes/me`,
			expect.anything()
		);
	});
});
