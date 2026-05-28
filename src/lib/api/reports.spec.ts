import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '$lib/api/client';
import { getMyReport, submitReport } from '$lib/api/reports';

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

describe('submitReport', () => {
	it('POSTs the reason payload with credentials', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ status: 'ACTIVE' }, 201));
		vi.stubGlobal('fetch', fetchMock);

		const res = await submitReport('abc', { reason: 'SCAM' });

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers/abc/reports`,
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
				body: JSON.stringify({ reason: 'SCAM' })
			})
		);
		expect(res).toEqual({ status: 'ACTIVE' });
	});

	it('includes the optional comment in the POST body when provided', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ status: 'REPORTED' }, 201));
		vi.stubGlobal('fetch', fetchMock);

		await submitReport('abc', { reason: 'INCORRECT_INFO', comment: 'Suspicious wording' });

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers/abc/reports`,
			expect.objectContaining({
				body: JSON.stringify({ reason: 'INCORRECT_INFO', comment: 'Suspicious wording' })
			})
		);
	});

	it('encodes the offer id in the URL', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ status: 'ACTIVE' }, 201));
		vi.stubGlobal('fetch', fetchMock);

		await submitReport('abc/def', { reason: 'OTHER' });

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers/abc%2Fdef/reports`,
			expect.anything()
		);
	});

	it('propagates ApiError on report.offer_not_reportable', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue(
					jsonResponse({ key: 'report.offer_not_reportable', statusCode: 400 }, 400)
				)
		);

		await expect(submitReport('abc', { reason: 'SCAM' })).rejects.toMatchObject({
			name: 'ApiError',
			key: 'report.offer_not_reportable',
			status: 400
		});
	});

	it('propagates ApiError on auth.unauthorized', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse({ key: 'auth.unauthorized', statusCode: 401 }, 401))
		);

		await expect(submitReport('abc', { reason: 'SCAM' })).rejects.toBeInstanceOf(ApiError);
	});
});

describe('getMyReport', () => {
	it('GETs the current user report with credentials', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ reason: 'SCAM' }, 200));
		vi.stubGlobal('fetch', fetchMock);

		const res = await getMyReport('abc');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers/abc/reports/me`,
			expect.objectContaining({
				method: 'GET',
				credentials: 'include'
			})
		);
		expect(res).toEqual({ reason: 'SCAM' });
	});

	it('returns null when the user has not reported the offer', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ reason: null }, 200)));

		await expect(getMyReport('abc')).resolves.toEqual({ reason: null });
	});

	it('encodes the offer id in the URL', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ reason: null }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await getMyReport('abc/def');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/offers/abc%2Fdef/reports/me`,
			expect.anything()
		);
	});
});
