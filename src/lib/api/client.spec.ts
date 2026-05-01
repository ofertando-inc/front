import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '$lib/api/client';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('apiRequest', () => {
	it('returns parsed JSON for successful responses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ ok: true }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			)
		);

		const response = await apiRequest<{ ok: boolean }>('/health');

		expect(response).toEqual({ ok: true });
	});

	it('sends JSON and bearer token headers', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})
		);
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

	it('throws ApiError with joined validation messages', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify({
						message: [
							'email must be an email',
							'password must be longer than or equal to 8 characters'
						],
						error: 'Bad Request',
						statusCode: 400
					}),
					{
						status: 400,
						headers: { 'Content-Type': 'application/json' }
					}
				)
			)
		);

		await expect(apiRequest('/auth/register')).rejects.toMatchObject({
			name: 'ApiError',
			status: 400,
			message: 'email must be an email\npassword must be longer than or equal to 8 characters'
		});
	});

	it('throws ApiError with string backend messages', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify({
						message: 'Email is already registered',
						error: 'Bad Request',
						statusCode: 400
					}),
					{
						status: 400,
						headers: { 'Content-Type': 'application/json' }
					}
				)
			)
		);

		await expect(apiRequest('/auth/register')).rejects.toMatchObject({
			name: 'ApiError',
			status: 400,
			message: 'Email is already registered'
		});
	});
});
