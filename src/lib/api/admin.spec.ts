import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '$lib/api/client';
import {
	blockMerchant,
	deleteLocation,
	disableOffer,
	disableUser,
	dismissComment,
	dismissOffer,
	editLocation,
	editMerchant,
	getModerationSummary,
	hideComment,
	listAdminCommentReports,
	listAdminComments,
	listAdminLocations,
	listAdminMerchants,
	listAdminOfferReports,
	listAdminOffers,
	listAdminReports,
	mergeMerchants,
	restoreComment,
	restoreOffer,
	restoreUser,
	unblockMerchant,
	verifyLocation,
	verifyMerchant
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

describe('getModerationSummary', () => {
	it('GETs the moderation summary counts', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse({ pendingComments: 5, pendingOfferReports: 2 }, 200));
		vi.stubGlobal('fetch', fetchMock);

		const res = await getModerationSummary();

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/moderation/summary`,
			expect.objectContaining({ method: 'GET', credentials: 'include' })
		);
		expect(res).toEqual({ pendingComments: 5, pendingOfferReports: 2 });
	});
});

describe('verifyMerchant', () => {
	it('PATCHes the verify endpoint with an optional reason/note body', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse({ id: 'm1', name: 'Acme', verified: true }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await verifyMerchant('m/1', { note: 'looks legit' });

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/merchants/m%2F1/verify`,
			expect.objectContaining({
				method: 'PATCH',
				credentials: 'include',
				body: JSON.stringify({ note: 'looks legit' })
			})
		);
	});
});

describe('verifyLocation', () => {
	it('PATCHes the location verify endpoint', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'l1', verified: true }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await verifyLocation('l1');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/locations/l1/verify`,
			expect.objectContaining({ method: 'PATCH', credentials: 'include', body: '{}' })
		);
	});
});

describe('mergeMerchants', () => {
	it('POSTs the source/target pair', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse({ id: 'target', name: 'Acme', verified: true }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await mergeMerchants({ sourceId: 's1', targetId: 't1' });

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/merchants/merge`,
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				body: JSON.stringify({ sourceId: 's1', targetId: 't1' })
			})
		);
	});

	it('propagates merchant.merge_invalid', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue(jsonResponse({ key: 'merchant.merge_invalid', statusCode: 400 }, 400))
		);

		await expect(mergeMerchants({ sourceId: 'x', targetId: 'x' })).rejects.toMatchObject({
			name: 'ApiError',
			key: 'merchant.merge_invalid',
			status: 400
		});
	});
});

describe('listAdminMerchants', () => {
	it('serializes the verified/blocked/q filters', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], nextCursor: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await listAdminMerchants({ blocked: true, q: 'café', limit: 20 });

		const url = fetchMock.mock.calls[0]?.[0] as string;
		expect(url).toContain('blocked=true');
		expect(url).toContain('q=caf%C3%A9');
		expect(url).toContain('limit=20');
	});
});

describe('listAdminLocations', () => {
	it('serializes the merchant filter', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], nextCursor: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await listAdminLocations({ verified: false, merchant: 'm1' });

		const url = fetchMock.mock.calls[0]?.[0] as string;
		expect(url).toContain('verified=false');
		expect(url).toContain('merchant=m1');
	});
});

describe('editMerchant', () => {
	it('PATCHes the new name', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'm1', name: 'New' }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await editMerchant('m1', { name: 'New' });

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/merchants/m1`,
			expect.objectContaining({
				method: 'PATCH',
				credentials: 'include',
				body: JSON.stringify({ name: 'New' })
			})
		);
	});

	it('propagates merchant.name_taken', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse({ key: 'merchant.name_taken', statusCode: 400 }, 400))
		);

		await expect(editMerchant('m1', { name: 'Dup' })).rejects.toMatchObject({
			name: 'ApiError',
			key: 'merchant.name_taken',
			status: 400
		});
	});
});

describe('blockMerchant / unblockMerchant', () => {
	it('POSTs to /block', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'm1', blockedAt: 'now' }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await blockMerchant('m1', { reason: 'spam' });

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/merchants/m1/block`,
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				body: JSON.stringify({ reason: 'spam' })
			})
		);
	});

	it('POSTs to /unblock', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'm1', blockedAt: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await unblockMerchant('m1');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/merchants/m1/unblock`,
			expect.objectContaining({ method: 'POST', credentials: 'include', body: '{}' })
		);
	});
});

describe('editLocation', () => {
	it('PATCHes the supplied fields', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'l1', city: 'Cali' }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await editLocation('l1', { city: 'Cali' });

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/locations/l1`,
			expect.objectContaining({
				method: 'PATCH',
				credentials: 'include',
				body: JSON.stringify({ city: 'Cali' })
			})
		);
	});
});

describe('deleteLocation', () => {
	it('DELETEs without a reassign target', async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		await deleteLocation('l1');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/locations/l1`,
			expect.objectContaining({ method: 'DELETE', credentials: 'include' })
		);
	});

	it('passes reassignTo as a query param', async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		await deleteLocation('l1', 'l2');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/admin/locations/l1?reassignTo=l2`,
			expect.objectContaining({ method: 'DELETE' })
		);
	});

	it('propagates location.in_use', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse({ key: 'location.in_use', statusCode: 409 }, 409))
		);

		await expect(deleteLocation('l1')).rejects.toMatchObject({
			name: 'ApiError',
			key: 'location.in_use',
			status: 409
		});
	});
});
