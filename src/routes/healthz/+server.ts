import { env } from '$env/dynamic/private';
import { json, type RequestHandler } from '@sveltejs/kit';
import { version } from '../../../package.json';

const DEEP_TIMEOUT_MS = 2000;
const HEADERS = { 'cache-control': 'no-store' };

/**
 * Supervision endpoint (Uptime Kuma, Docker healthcheck).
 *
 * - `GET /healthz` — liveness of the SvelteKit server itself.
 * - `GET /healthz?deep=1` — additionally probes `BACK_URL/health/live`
 *   directly (server-side, not through the public /api proxy) so external
 *   monitoring can verify BFF → API connectivity; 503 when the API is down.
 */
export const GET: RequestHandler = async ({ url }) => {
	if (url.searchParams.get('deep') !== '1') {
		return json({ status: 'ok', version }, { headers: HEADERS });
	}

	try {
		const backUrl = env.BACK_URL?.replace(/\/+$/, '');
		if (!backUrl) {
			throw new Error('BACK_URL is not configured');
		}
		const response = await fetch(`${backUrl}/health/live`, {
			signal: AbortSignal.timeout(DEEP_TIMEOUT_MS)
		});
		if (!response.ok) {
			throw new Error(`API health returned ${response.status}`);
		}
	} catch {
		return json({ status: 'degraded', api: 'down', version }, { status: 503, headers: HEADERS });
	}

	return json({ status: 'ok', api: 'ok', version }, { headers: HEADERS });
};
