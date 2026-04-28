import { PUBLIC_API_URL } from '$env/static/public';

interface RequestOptions extends RequestInit {
	token?: string;
}

export class ApiError extends Error {
	status: number;
	details: unknown;

	constructor(message: string, status: number, details?: unknown) {
		super(message);
		this.name = 'ApiError';
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
		const messagePayload =
			typeof payload === 'object' && payload !== null && 'message' in payload
				? payload.message
				: 'Request failed';
		const messages = Array.isArray(messagePayload)
			? messagePayload.map(String)
			: [String(messagePayload)];

		throw new ApiError(messages.join('\n'), response.status, payload);
	}

	return payload as T;
}
