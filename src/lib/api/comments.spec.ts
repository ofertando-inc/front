import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '$lib/api/client';
import {
	createComment,
	deleteComment,
	listComments,
	listReplies,
	updateComment
} from '$lib/api/comments';

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

describe('listComments', () => {
	it('GETs the root thread with credentials and no query when omitted', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], nextCursor: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await listComments('abc');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers/abc/comments`,
			expect.objectContaining({ method: 'GET', credentials: 'include' })
		);
	});

	it('serializes limit and cursor and encodes the offer id', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], nextCursor: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await listComments('a/b', { limit: 20, cursor: 'eyJ' });

		const url = fetchMock.mock.calls[0]?.[0] as string;
		expect(url).toContain('/offers/a%2Fb/comments?');
		expect(url).toContain('limit=20');
		expect(url).toContain('cursor=eyJ');
	});
});

describe('listReplies', () => {
	it('GETs the replies of a comment with id encoding', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], nextCursor: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await listReplies('abc', 'c/1', { limit: 10 });

		const url = fetchMock.mock.calls[0]?.[0] as string;
		expect(url).toContain('/offers/abc/comments/c%2F1/replies?');
		expect(url).toContain('limit=10');
	});
});

describe('createComment', () => {
	it('POSTs the content for a root comment', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'n', content: 'hi' }, 201));
		vi.stubGlobal('fetch', fetchMock);

		await createComment('abc', { content: 'hi' });

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers/abc/comments`,
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
				body: JSON.stringify({ content: 'hi' })
			})
		);
	});

	it('includes parentId for a reply', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'n', content: 'hi' }, 201));
		vi.stubGlobal('fetch', fetchMock);

		await createComment('abc', { content: 'reply', parentId: 'root-1' });

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers/abc/comments`,
			expect.objectContaining({ body: JSON.stringify({ content: 'reply', parentId: 'root-1' }) })
		);
	});

	it('propagates ApiError on comment.offer_not_commentable', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue(
					jsonResponse({ key: 'comment.offer_not_commentable', statusCode: 400 }, 400)
				)
		);

		await expect(createComment('abc', { content: 'x' })).rejects.toMatchObject({
			name: 'ApiError',
			key: 'comment.offer_not_commentable',
			status: 400
		});
	});
});

describe('updateComment', () => {
	it('PATCHes the new content with id encoding', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse({ id: 'c1', content: 'edited', editedAt: 'now' }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await updateComment('abc', 'c1', { content: 'edited' });

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers/abc/comments/c1`,
			expect.objectContaining({
				method: 'PATCH',
				credentials: 'include',
				body: JSON.stringify({ content: 'edited' })
			})
		);
	});

	it('propagates ApiError on comment.forbidden', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse({ key: 'comment.forbidden', statusCode: 403 }, 403))
		);

		await expect(updateComment('abc', 'c1', { content: 'x' })).rejects.toBeInstanceOf(ApiError);
	});
});

describe('deleteComment', () => {
	it('DELETEs and returns the tombstone payload', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse({ id: 'c1', content: null, deleted: true }, 200));
		vi.stubGlobal('fetch', fetchMock);

		const res = await deleteComment('abc', 'c1');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers/abc/comments/c1`,
			expect.objectContaining({ method: 'DELETE', credentials: 'include' })
		);
		expect(res).toEqual({ id: 'c1', content: null, deleted: true });
	});

	it('propagates ApiError on comment.not_found', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse({ key: 'comment.not_found', statusCode: 404 }, 404))
		);

		await expect(deleteComment('abc', 'missing')).rejects.toMatchObject({
			name: 'ApiError',
			key: 'comment.not_found',
			status: 404
		});
	});
});
