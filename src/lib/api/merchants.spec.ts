import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMerchant, getMerchant, searchMerchants } from '$lib/api/merchants';

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

describe('searchMerchants', () => {
	it('calls /merchants without a query string when q is omitted', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse([], 200));
		vi.stubGlobal('fetch', fetchMock);

		await searchMerchants();

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/merchants`,
			expect.objectContaining({ method: 'GET', credentials: 'include' })
		);
	});

	it('encodes the q parameter', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse([], 200));
		vi.stubGlobal('fetch', fetchMock);

		await searchMerchants('Éxito café');

		const url = fetchMock.mock.calls[0]?.[0] as string;
		expect(url).toContain('/merchants?q=');
		expect(url).toContain('q=%C3%89xito+caf%C3%A9');
	});
});

describe('getMerchant', () => {
	it('encodes the id in the URL', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'a/b' }, 200));
		vi.stubGlobal('fetch', fetchMock);

		await getMerchant('a/b');

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/merchants/a%2Fb`,
			expect.objectContaining({ method: 'GET' })
		);
	});
});

describe('createMerchant', () => {
	it('POSTs the JSON body with credentials', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'm1', name: 'Amazon' }, 201));
		vi.stubGlobal('fetch', fetchMock);

		await createMerchant({ name: 'Amazon' });

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE_URL}/merchants`,
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				body: JSON.stringify({ name: 'Amazon' })
			})
		);
	});
});
