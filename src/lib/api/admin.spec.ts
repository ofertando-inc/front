import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '$lib/api/client';
import {
	disableOffer,
	disableUser,
	dismissComment,
	dismissOffer,
	hideComment,
	listAdminCommentReports,
	listAdminComments,
	listAdminOfferReports,
	listAdminOffers,
	listAdminReports,
	restoreComment,
	restoreOffer,
	restoreUser
} from '$lib/api/admin';

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

describe('listAdminOffers', () => {
	it('calls /admin/offers without a query string when no params are provided', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], nextCursor: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await listAdminOffers();

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/offers`,
			expect.objectContaining({ method: 'GET', credentials: 'include' })
		);
	});

	it('serializes the status filter alongside the shared query params', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], nextCursor: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await listAdminOffers({ status: 'DISABLED', sort: 'date', limit: 20 });

		const url = fetchMock.mock.calls[0]?.[0] as string;
		expect(url).toContain('status=DISABLED');
		expect(url).toContain('sort=date');
		expect(url).toContain('limit=20');
	});

	it('propagates ApiError on auth.forbidden for non-admins', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse({ key: 'auth.forbidden', statusCode: 403 }, 403))
		);

		await expect(listAdminOffers()).rejects.toMatchObject({
			name: 'ApiError',
			key: 'auth.forbidden',
			status: 403
		});
	});
});

describe('disableOffer', () => {
	it('PATCHes the disable endpoint with credentials', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse({ id: 'abc', status: 'DISABLED' }, 200));
		vi.stubGlobal('fetch', fetchMock);

		const res = await disableOffer('abc');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/offers/abc/disable`,
			expect.objectContaining({ method: 'PATCH', credentials: 'include' })
		);
		expect(res).toEqual({ id: 'abc', status: 'DISABLED' });
	});

	it('encodes the offer id in the URL', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse({ id: 'a/b', status: 'DISABLED' }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await disableOffer('a/b');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/offers/a%2Fb/disable`,
			expect.anything()
		);
	});
});

describe('restoreOffer', () => {
	it('PATCHes the restore endpoint and returns the active offer', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse({ id: 'abc', status: 'ACTIVE', reportCount: 0 }, 200));
		vi.stubGlobal('fetch', fetchMock);

		const res = await restoreOffer('abc');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/offers/abc/restore`,
			expect.objectContaining({ method: 'PATCH', credentials: 'include' })
		);
		expect(res).toEqual({ id: 'abc', status: 'ACTIVE', reportCount: 0 });
	});
});

describe('listAdminReports', () => {
	it('GETs /admin/reports with cursor and limit', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], nextCursor: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await listAdminReports({ cursor: 'abc', limit: 10 });

		const url = fetchMock.mock.calls[0]?.[0] as string;
		expect(url).toContain('/admin/reports?');
		expect(url).toContain('cursor=abc');
		expect(url).toContain('limit=10');
	});

	it('propagates ApiError on auth.unauthorized for anonymous callers', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse({ key: 'auth.unauthorized', statusCode: 401 }, 401))
		);

		await expect(listAdminReports()).rejects.toBeInstanceOf(ApiError);
	});
});

describe('disableUser', () => {
	it('PATCHes the user disable endpoint with credentials', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse({ id: 'u1', status: 'DISABLED' }, 200));
		vi.stubGlobal('fetch', fetchMock);

		const res = await disableUser('u1');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/users/u1/disable`,
			expect.objectContaining({ method: 'PATCH', credentials: 'include' })
		);
		expect(res).toEqual({ id: 'u1', status: 'DISABLED' });
	});
});

describe('restoreUser', () => {
	it('PATCHes the user restore endpoint and returns the active user', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'u1', status: 'ACTIVE' }, 200));
		vi.stubGlobal('fetch', fetchMock);

		const res = await restoreUser('u1');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/users/u1/restore`,
			expect.objectContaining({ method: 'PATCH', credentials: 'include' })
		);
		expect(res).toEqual({ id: 'u1', status: 'ACTIVE' });
	});
});

describe('listAdminComments', () => {
	it('GETs the moderation queue with cursor and limit', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], nextCursor: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await listAdminComments({ cursor: 'abc', limit: 20 });

		const url = fetchMock.mock.calls[0]?.[0] as string;
		expect(url).toContain('/admin/comments?');
		expect(url).toContain('cursor=abc');
		expect(url).toContain('limit=20');
	});

	it('propagates ApiError on auth.forbidden', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse({ key: 'auth.forbidden', statusCode: 403 }, 403))
		);

		await expect(listAdminComments()).rejects.toMatchObject({ name: 'ApiError', status: 403 });
	});
});

describe('hideComment / dismissComment / restoreComment', () => {
	it('PATCHes the hide endpoint with id encoding', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'c1', hiddenAt: 'now' }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await hideComment('c/1');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/comments/c%2F1/hide`,
			expect.objectContaining({ method: 'PATCH', credentials: 'include' })
		);
	});

	it('PATCHes the dismiss endpoint', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'c1', reportCount: 0 }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await dismissComment('c1');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/comments/c1/dismiss`,
			expect.objectContaining({ method: 'PATCH', credentials: 'include' })
		);
	});

	it('PATCHes the restore endpoint', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'c1', hiddenAt: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await restoreComment('c1');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/comments/c1/restore`,
			expect.objectContaining({ method: 'PATCH', credentials: 'include' })
		);
	});
});

describe('listAdminCommentReports / listAdminOfferReports', () => {
	it('GETs the report details of a comment with id encoding', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], nextCursor: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await listAdminCommentReports('c/1', { limit: 10 });

		const url = fetchMock.mock.calls[0]?.[0] as string;
		expect(url).toContain('/admin/comments/c%2F1/reports?');
		expect(url).toContain('limit=10');
	});

	it('GETs the report details of an offer', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], nextCursor: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await listAdminOfferReports('o1');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/offers/o1/reports`,
			expect.objectContaining({ method: 'GET', credentials: 'include' })
		);
	});
});

describe('dismissOffer', () => {
	it('PATCHes the offer dismiss endpoint and returns the active offer', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'o1', status: 'ACTIVE' }, 200));
		vi.stubGlobal('fetch', fetchMock);

		const res = await dismissOffer('o1');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/offers/o1/dismiss`,
			expect.objectContaining({ method: 'PATCH', credentials: 'include' })
		);
		expect(res).toEqual({ id: 'o1', status: 'ACTIVE' });
	});
});
