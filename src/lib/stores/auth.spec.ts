import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import type { AuthResponse, User } from '$lib/types/auth';

vi.mock('$lib/api/auth', () => ({
	getCurrentUser: vi.fn(),
	login: vi.fn(),
	register: vi.fn()
}));

vi.mock('$app/environment', () => ({
	browser: true
}));

import { getCurrentUser, login as loginRequest, register as registerRequest } from '$lib/api/auth';
import { AUTH_TOKEN_KEY, createAuthStore } from '$lib/stores/auth';

const user: User = {
	id: 'user-1',
	email: 'maria@example.com',
	username: 'maria123',
	role: 'USER',
	status: 'ACTIVE',
	createdAt: '2026-04-28T12:18:37.315Z',
	updatedAt: '2026-04-28T12:18:37.315Z'
};

const authResponse: AuthResponse = {
	accessToken: 'jwt-token',
	user
};

const loginMock = vi.mocked(loginRequest);
const registerMock = vi.mocked(registerRequest);
const getCurrentUserMock = vi.mocked(getCurrentUser);

function createLocalStorageMock() {
	const store = new Map<string, string>();

	return {
		clear: vi.fn(() => store.clear()),
		getItem: vi.fn((key: string) => store.get(key) ?? null),
		removeItem: vi.fn((key: string) => store.delete(key)),
		setItem: vi.fn((key: string, value: string) => {
			store.set(key, value);
		})
	};
}

beforeEach(() => {
	vi.stubGlobal('localStorage', createLocalStorageMock());
	localStorage.clear();
	vi.clearAllMocks();
});

describe('auth store', () => {
	it('loads an existing token from localStorage on initialize', () => {
		localStorage.setItem(AUTH_TOKEN_KEY, 'stored-token');
		const store = createAuthStore();

		store.initialize();

		expect(get(store)).toMatchObject({
			accessToken: 'stored-token',
			isAuthenticated: true,
			user: null
		});
	});

	it('stores token and user after login succeeds', async () => {
		loginMock.mockResolvedValue(authResponse);
		const store = createAuthStore();

		const result = await store.login('maria@example.com', 'password123');

		expect(loginMock).toHaveBeenCalledWith({
			email: 'maria@example.com',
			password: 'password123'
		});
		expect(result).toEqual(user);
		expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('jwt-token');
		expect(get(store)).toMatchObject({
			accessToken: 'jwt-token',
			user,
			isAuthenticated: true,
			isLoading: false,
			error: null
		});
	});

	it('stores token and user after register succeeds', async () => {
		registerMock.mockResolvedValue(authResponse);
		const store = createAuthStore();

		const result = await store.register('maria@example.com', 'maria123', 'password123');

		expect(registerMock).toHaveBeenCalledWith({
			email: 'maria@example.com',
			username: 'maria123',
			password: 'password123'
		});
		expect(result).toEqual(user);
		expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('jwt-token');
		expect(get(store)).toMatchObject({
			accessToken: 'jwt-token',
			user,
			isAuthenticated: true,
			isLoading: false,
			error: null
		});
	});

	it('clears token and state on logout', async () => {
		loginMock.mockResolvedValue(authResponse);
		const store = createAuthStore();

		await store.login('maria@example.com', 'password123');
		store.logout();

		expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
		expect(get(store)).toMatchObject({
			accessToken: null,
			user: null,
			isAuthenticated: false,
			isLoading: false,
			error: null
		});
	});

	it('loads the current user with the stored token', async () => {
		localStorage.setItem(AUTH_TOKEN_KEY, 'stored-token');
		getCurrentUserMock.mockResolvedValue(user);
		const store = createAuthStore();
		store.initialize();

		const result = await store.loadCurrentUser();

		expect(getCurrentUserMock).toHaveBeenCalledWith('stored-token');
		expect(result).toEqual(user);
		expect(get(store)).toMatchObject({
			accessToken: 'stored-token',
			user,
			isAuthenticated: true,
			isLoading: false,
			error: null
		});
	});

	it('clears auth state when current user loading fails', async () => {
		localStorage.setItem(AUTH_TOKEN_KEY, 'stored-token');
		getCurrentUserMock.mockRejectedValue(new Error('Unauthorized'));
		const store = createAuthStore();
		store.initialize();

		await expect(store.loadCurrentUser()).rejects.toThrow('Unauthorized');

		expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
		expect(get(store)).toMatchObject({
			accessToken: null,
			user: null,
			isAuthenticated: false,
			isLoading: false,
			error: 'Unauthorized'
		});
	});
});
