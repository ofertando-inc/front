import { apiRequest } from '$lib/api/client';
import type { UpdateMeDto, User, UserStats } from '$lib/types/auth';

interface LoginPayload {
	email: string;
	password: string;
}

interface RegisterPayload extends LoginPayload {
	username: string;
}

export function login(payload: LoginPayload) {
	return apiRequest<User>('/auth/login', {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

export function register(payload: RegisterPayload) {
	return apiRequest<User>('/auth/register', {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

export function getCurrentUser() {
	return apiRequest<User>('/users/me', {
		method: 'GET'
	});
}

export function getMyStats() {
	return apiRequest<UserStats>('/users/me/stats', {
		method: 'GET'
	});
}

export function updateMe(payload: UpdateMeDto) {
	return apiRequest<User>('/users/me', {
		method: 'PATCH',
		body: JSON.stringify(payload)
	});
}

export function refreshSession() {
	return apiRequest<User>('/auth/refresh', {
		method: 'POST'
	});
}

export function logout() {
	return apiRequest<void>('/auth/logout', {
		method: 'POST'
	});
}
