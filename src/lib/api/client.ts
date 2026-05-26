import { browser } from '$app/environment';

interface RequestOptions extends RequestInit {
	_isRetry?: boolean;
}

export class ApiError extends Error {
	readonly key: string | null;
	readonly status: number;
	readonly details: unknown;
	readonly retryAfterSeconds: number | null;

	constructor(
		key: string | null,
		status: number,
		details?: unknown,
		retryAfterSeconds: number | null = null
	) {
		super(key ?? 'API request failed');
		this.name = 'ApiError';
		this.key = key;
		this.status = status;
		this.details = details;
		this.retryAfterSeconds = retryAfterSeconds;
	}
}

function parseRetryAfter(value: string | null): number | null {
	if (!value) return null;
	const seconds = Number.parseInt(value, 10);
	if (Number.isFinite(seconds) && seconds >= 0) return seconds;
	return null;
}

function getApiBaseUrl(): string {
	if (browser) {
		// Always go through the SvelteKit BFF catch-all at /api/*. The browser
		// never talks to the backend directly — see src/routes/api/[...path].
		return '/api';
	}

	// Server-side path (Vitest server tests). The test setup stubs
	// PUBLIC_API_URL via vi.stubEnv to point at a deterministic origin.
	const url = process.env.PUBLIC_API_URL;
	if (!url) {
		throw new Error('PUBLIC_API_URL is not defined');
	}
	return url;
}

function getApiUrl(path: string) {
	return `${getApiBaseUrl()}${path}`;
}

function extractErrorKey(payload: unknown): string | null {
	if (payload && typeof payload === 'object' && 'key' in payload) {
		const key = (payload as { key: unknown }).key;
		if (typeof key === 'string' && key.length > 0) {
			return key;
		}
	}

	return null;
}

function extractErrorDetails(payload: unknown): unknown {
	if (payload && typeof payload === 'object' && 'details' in payload) {
		return (payload as { details: unknown }).details;
	}

	return undefined;
}

// Single in-flight refresh promise shared across concurrent 401-driven retries.
// Without this mutex, two simultaneous 401 responses would each trigger a refresh
// — the second one would replay an already-rotated refresh token and trip the
// backend reuse detection, revoking every session for the user.
let refreshInFlight: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
	if (refreshInFlight) return refreshInFlight;

	const promise = (async () => {
		try {
			const response = await fetch(getApiUrl('/auth/refresh'), {
				method: 'POST',
				credentials: 'include'
			});
			return response.ok;
		} catch {
			return false;
		}
	})();

	refreshInFlight = promise;

	promise.finally(() => {
		if (refreshInFlight === promise) {
			refreshInFlight = null;
		}
	});

	return promise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const { _isRetry, headers, body, ...rest } = options;

	const response = await fetch(getApiUrl(path), {
		...rest,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			...headers
		},
		body
	});

	// Refresh on 401, retry once. Skip for /auth/* endpoints — a 401 on login is
	// "wrong credentials", not "session expired", and refreshing during login
	// would mask the real error.
	if (response.status === 401 && !_isRetry && !path.startsWith('/auth/')) {
		const refreshed = await attemptRefresh();
		if (refreshed) {
			return apiRequest<T>(path, { ...options, _isRetry: true });
		}
	}

	const isJson = response.headers.get('content-type')?.includes('application/json');
	const payload = isJson ? await response.json() : null;

	if (!response.ok) {
		throw new ApiError(
			extractErrorKey(payload),
			response.status,
			extractErrorDetails(payload),
			parseRetryAfter(response.headers.get('Retry-After'))
		);
	}

	return payload as T;
}
