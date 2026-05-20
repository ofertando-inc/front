import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from '$lib/api/client';

beforeEach(() => {
	vi.stubEnv('PUBLIC_API_URL', 'http://test.local');
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

async function captureApiError(run: () => Promise<unknown>): Promise<ApiError> {
	try {
		await run();
	} catch (error) {
		if (error instanceof ApiError) return error;
		throw error;
	}
	throw new Error('Expected ApiError to be thrown');
}

describe('apiRequest', () => {
	it('returns parsed JSON for successful responses', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ ok: true }, 200)));

		const response = await apiRequest<{ ok: boolean }>('/health');

		expect(response).toEqual({ ok: true });
	});

	it('sends credentials with every request so the browser ships the session cookie', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await apiRequest('/users/me', { method: 'GET' });

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining('/users/me'),
			expect.objectContaining({
				method: 'GET',
				credentials: 'include',
				headers: expect.objectContaining({ 'Content-Type': 'application/json' })
			})
		);
	});

	it('throws ApiError carrying key and details for structured backend errors', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				jsonResponse(
					{
						key: 'validation.failed',
						statusCode: 400,
						details: {
							fields: [
								{ field: 'email', constraints: ['isEmail'] },
								{ field: 'password', constraints: ['minLength'] }
							]
						}
					},
					400
				)
			)
		);

		await expect(apiRequest('/auth/register')).rejects.toMatchObject({
			name: 'ApiError',
			key: 'validation.failed',
			status: 400,
			details: {
				fields: [
					{ field: 'email', constraints: ['isEmail'] },
					{ field: 'password', constraints: ['minLength'] }
				]
			}
		});
	});

	it('throws ApiError with the key but no details when the backend omits them', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue(jsonResponse({ key: 'auth.invalid_credentials', statusCode: 401 }, 401))
		);

		const error = await captureApiError(() => apiRequest('/auth/login'));

		expect(error.key).toBe('auth.invalid_credentials');
		expect(error.status).toBe(401);
		expect(error.details).toBeUndefined();
	});

	it('throws ApiError with null key when the response is not JSON', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Bad Gateway', { status: 502 })));

		const error = await captureApiError(() => apiRequest('/health'));

		expect(error.key).toBeNull();
		expect(error.status).toBe(502);
		expect(error.details).toBeUndefined();
	});

	it('throws ApiError with null key when the JSON payload has no key field', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ statusCode: 500 }, 500)));

		const error = await captureApiError(() => apiRequest('/health'));

		expect(error.key).toBeNull();
		expect(error.status).toBe(500);
	});

	it('reads Retry-After seconds from the response headers', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ key: 'error.too_many_requests', statusCode: 429 }), {
					status: 429,
					headers: {
						'Content-Type': 'application/json',
						'Retry-After': '42'
					}
				})
			)
		);

		const error = await captureApiError(() => apiRequest('/auth/login'));

		expect(error.key).toBe('error.too_many_requests');
		expect(error.status).toBe(429);
		expect(error.retryAfterSeconds).toBe(42);
	});

	it('falls back to a null retryAfterSeconds when the header is missing or invalid', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ key: 'error.too_many_requests', statusCode: 429 }), {
					status: 429,
					headers: {
						'Content-Type': 'application/json',
						'Retry-After': 'Wed, 21 Oct 2026 07:28:00 GMT'
					}
				})
			)
		);

		const error = await captureApiError(() => apiRequest('/auth/login'));

		expect(error.retryAfterSeconds).toBeNull();
	});

	it('attempts /auth/refresh on a 401 and retries the original request when refresh succeeds', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(jsonResponse({ key: 'auth.unauthorized', statusCode: 401 }, 401))
			.mockResolvedValueOnce(new Response(null, { status: 200 }))
			.mockResolvedValueOnce(jsonResponse({ id: 'user-1' }, 200));
		vi.stubGlobal('fetch', fetchMock);

		const result = await apiRequest<{ id: string }>('/users/me');

		expect(result).toEqual({ id: 'user-1' });
		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(fetchMock.mock.calls[1]?.[0]).toContain('/auth/refresh');
		expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
			method: 'POST',
			credentials: 'include'
		});
	});

	it('propagates the 401 when /auth/refresh also fails', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(jsonResponse({ key: 'auth.unauthorized', statusCode: 401 }, 401))
			.mockResolvedValueOnce(new Response(null, { status: 401 }));
		vi.stubGlobal('fetch', fetchMock);

		const error = await captureApiError(() => apiRequest('/users/me'));

		expect(error.status).toBe(401);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('does not attempt a refresh when the failing endpoint is /auth/*', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse({ key: 'auth.invalid_credentials', statusCode: 401 }, 401));
		vi.stubGlobal('fetch', fetchMock);

		await captureApiError(() => apiRequest('/auth/login', { method: 'POST' }));

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('does not retry twice if the retried request also returns 401', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(jsonResponse({ key: 'auth.unauthorized', statusCode: 401 }, 401))
			.mockResolvedValueOnce(new Response(null, { status: 200 }))
			.mockResolvedValueOnce(jsonResponse({ key: 'auth.unauthorized', statusCode: 401 }, 401));
		vi.stubGlobal('fetch', fetchMock);

		const error = await captureApiError(() => apiRequest('/users/me'));

		expect(error.status).toBe(401);
		expect(fetchMock).toHaveBeenCalledTimes(3);
	});

	it('shares a single /auth/refresh call across concurrent 401-driven retries', async () => {
		let resolveRefresh!: (response: Response) => void;
		const refreshPromise = new Promise<Response>((resolve) => {
			resolveRefresh = resolve;
		});

		const fetchMock = vi.fn().mockImplementation((url: string) => {
			if (typeof url === 'string' && url.includes('/auth/refresh')) {
				return refreshPromise;
			}
			if (typeof url === 'string' && url.includes('/users/me')) {
				return Promise.resolve(jsonResponse({ ok: true }, 200));
			}
			if (typeof url === 'string' && url.includes('/offers/mine')) {
				return Promise.resolve(jsonResponse({ items: [], nextCursor: null }, 200));
			}
			return Promise.resolve(jsonResponse({ key: 'auth.unauthorized', statusCode: 401 }, 401));
		});

		// Force a 401 on the first attempt of each, then 200 on retry
		fetchMock.mockResolvedValueOnce(
			jsonResponse({ key: 'auth.unauthorized', statusCode: 401 }, 401)
		);
		fetchMock.mockResolvedValueOnce(
			jsonResponse({ key: 'auth.unauthorized', statusCode: 401 }, 401)
		);

		vi.stubGlobal('fetch', fetchMock);

		const callA = apiRequest('/users/me');
		const callB = apiRequest('/offers/mine');

		// Yield so both fetches start and both queue the refresh
		await Promise.resolve();
		await Promise.resolve();

		resolveRefresh(new Response(null, { status: 200 }));

		await Promise.all([callA, callB]);

		const refreshCalls = fetchMock.mock.calls.filter(
			(call) => typeof call[0] === 'string' && call[0].includes('/auth/refresh')
		);
		expect(refreshCalls).toHaveLength(1);
	});
});
