import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { version } from '../../../package.json';
import { GET } from './+server';

vi.mock('$env/dynamic/private', () => ({
	env: { BACK_URL: 'http://backend.test' }
}));

afterEach(() => {
	vi.unstubAllGlobals();
});

function healthzEvent(query = '') {
	return { url: new URL(`http://front.test/healthz${query}`) } as RequestEvent;
}

describe('GET /healthz', () => {
	it('reports the server alive with the package version, uncached', async () => {
		const response = await GET(healthzEvent());

		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual({ status: 'ok', version });
	});

	it('does not touch the backend without deep=1', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		await GET(healthzEvent());

		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('deep=1 probes BACK_URL/health/live and reports the API up', async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		const response = await GET(healthzEvent('?deep=1'));

		expect(fetchMock).toHaveBeenCalledWith(
			'http://backend.test/health/live',
			expect.objectContaining({ signal: expect.any(AbortSignal) })
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ status: 'ok', api: 'ok', version });
	});

	it('deep=1 responds 503 degraded when the API is unreachable', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED')));

		const response = await GET(healthzEvent('?deep=1'));

		expect(response.status).toBe(503);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual({ status: 'degraded', api: 'down', version });
	});

	it('deep=1 responds 503 degraded when the API answers an error status', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })));

		const response = await GET(healthzEvent('?deep=1'));

		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({ status: 'degraded', api: 'down', version });
	});
});
