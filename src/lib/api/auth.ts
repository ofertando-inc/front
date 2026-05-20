import { apiRequest } from '$lib/api/client';
import type { AuthResponse, User } from '$lib/types/auth';

interface LoginPayload {
	email: string;
	password: string;
}

interface RegisterPayload extends LoginPayload {
	username: string;
}

export function login(payload: LoginPayload) {
	return apiRequest<AuthResponse>('/auth/login', {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

export function register(payload: RegisterPayload) {
	return apiRequest<AuthResponse>('/auth/register', {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

// The token parameter is kept for compatibility with existing call sites and
// will be removed in the next commit alongside the auth store refactor.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getCurrentUser(_token?: string) {
	return apiRequest<User>('/users/me', {
		method: 'GET'
	});
}
