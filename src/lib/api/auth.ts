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

export function getCurrentUser(token: string) {
	return apiRequest<User>('/users/me', {
		method: 'GET',
		token
	});
}
