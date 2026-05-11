import { PUBLIC_API_URL } from '$env/static/public';

interface RequestOptions extends RequestInit {
	token?: string;
}

export class ApiError extends Error {
	readonly key: string | null;
	readonly status: number;
	readonly details: unknown;

	constructor(key: string | null, status: number, details?: unknown) {
		super(key ?? 'API request failed');
		this.name = 'ApiError';
		this.key = key;
		this.status = status;
		this.details = details;
	}
}

function getApiUrl(path: string) {
	if (!PUBLIC_API_URL) {
		throw new Error('PUBLIC_API_URL is not defined');
	}

	return `${PUBLIC_API_URL}${path}`;
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
		throw new ApiError(extractErrorKey(payload), response.status, extractErrorDetails(payload));
	}

	return payload as T;
}
