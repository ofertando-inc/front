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

	it('sends JSON and bearer token headers', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await apiRequest('/users/me', {
			method: 'GET',
			token: 'jwt-token'
		});

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining('/users/me'),
			expect.objectContaining({
				headers: expect.objectContaining({
					Authorization: 'Bearer jwt-token',
					'Content-Type': 'application/json'
				})
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
});
