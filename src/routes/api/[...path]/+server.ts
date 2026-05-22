import { env } from '$env/dynamic/private';
import { error, type RequestHandler } from '@sveltejs/kit';

const HOP_BY_HOP_HEADERS = new Set([
	'host',
	'connection',
	'content-length',
	'keep-alive',
	'proxy-authenticate',
	'proxy-authorization',
	'te',
	'trailers',
	'transfer-encoding',
	'upgrade'
]);

const proxy: RequestHandler = async ({ request, params }) => {
	const backUrl = env.BACK_URL;
	if (!backUrl) {
		error(500, 'BACK_URL is not configured on the SvelteKit server.');
	}

	const path = params.path ?? '';
	const incoming = new URL(request.url);
	const target = `${backUrl.replace(/\/+$/, '')}/${path}${incoming.search}`;

	const requestHeaders = new Headers();
	request.headers.forEach((value, key) => {
		if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
			requestHeaders.set(key, value);
		}
	});

	const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
	const init: RequestInit = {
		method: request.method,
		headers: requestHeaders,
		body: hasBody ? await request.arrayBuffer() : undefined,
		redirect: 'manual'
	};

	let backResponse: Response;
	try {
		backResponse = await fetch(target, init);
	} catch {
		error(502, 'Upstream backend unreachable.');
	}

	const responseHeaders = new Headers();
	backResponse.headers.forEach((value, key) => {
		if (key.toLowerCase() !== 'set-cookie') {
			responseHeaders.set(key, value);
		}
	});

	// Forward Set-Cookie individually. The backend scopes its refresh cookie
	// with Path=/auth so the browser only sends it on /auth/* routes. Through
	// the BFF the effective path becomes /api/auth/*, so we rewrite the
	// attribute accordingly. Other Set-Cookie attributes (Domain, HttpOnly,
	// SameSite, Secure, Max-Age) are forwarded as-is.
	const setCookies = backResponse.headers.getSetCookie?.() ?? [];
	for (const cookie of setCookies) {
		const rewritten = cookie.replace(/(\bPath\s*=\s*)\/auth\b/gi, '$1/api/auth');
		responseHeaders.append('set-cookie', rewritten);
	}

	return new Response(backResponse.body, {
		status: backResponse.status,
		statusText: backResponse.statusText,
		headers: responseHeaders
	});
};

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
