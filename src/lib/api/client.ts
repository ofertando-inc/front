import { browser } from '$app/environment';

interface RequestOptions extends RequestInit {
	token?: string;
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
		const url = window.APP_CONFIG?.API_URL;
		if (!url) {
			throw new Error('window.APP_CONFIG.API_URL is not defined');
		}
		return url;
	}

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

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const { token, headers, body, ...rest } = options;

	const response = await fetch(getApiUrl(path), {
		...rest,
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...headers
		},
		body
	});

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
