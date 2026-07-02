import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import type { User } from '$lib/types/auth';

vi.mock('$lib/api/auth', () => ({
	getCurrentUser: vi.fn(),
	login: vi.fn(),
	logout: vi.fn(),
	register: vi.fn()
}));

import {
	getCurrentUser,
	login as loginRequest,
	logout as logoutRequest,
	register as registerRequest
} from '$lib/api/auth';
import { createAuthStore } from '$lib/stores/auth';

const user: User = {
	id: 'user-1',
	email: 'maria@example.com',
	username: 'maria123',
	role: 'USER',
	accountType: 'INDIVIDUAL',
	status: 'ACTIVE',
	reputation: 8,
	createdAt: '2026-04-28T12:18:37.315Z',
	updatedAt: '2026-04-28T12:18:37.315Z'
};

const loginMock = vi.mocked(loginRequest);
const registerMock = vi.mocked(registerRequest);
const logoutMock = vi.mocked(logoutRequest);
const getCurrentUserMock = vi.mocked(getCurrentUser);

beforeEach(() => {
	vi.clearAllMocks();
});

describe('auth store', () => {
	it('stores the user after login succeeds', async () => {
		loginMock.mockResolvedValue(user);
		const store = createAuthStore();

		const result = await store.login('maria@example.com', 'password123');

		expect(loginMock).toHaveBeenCalledWith({
			email: 'maria@example.com',
			password: 'password123'
		});
		expect(result).toEqual(user);
		expect(get(store)).toMatchObject({
			user,
			isAuthenticated: true,
			isLoading: false
		});
	});

	it('clears isLoading and rethrows when login fails', async () => {
		loginMock.mockRejectedValue(new Error('invalid'));
		const store = createAuthStore();

		await expect(store.login('a@b.c', 'pw')).rejects.toThrow('invalid');
		expect(get(store)).toMatchObject({
			user: null,
			isAuthenticated: false,
			isLoading: false
		});
	});

	it('stores the user after register succeeds', async () => {
		registerMock.mockResolvedValue(user);
		const store = createAuthStore();

		const result = await store.register('maria@example.com', 'maria123', 'password123');

		expect(registerMock).toHaveBeenCalledWith({
			email: 'maria@example.com',
			username: 'maria123',
			password: 'password123'
		});
		expect(result).toEqual(user);
		expect(get(store)).toMatchObject({
			user,
			isAuthenticated: true,
			isLoading: false
		});
	});

	it('calls the logout endpoint and clears the state', async () => {
		loginMock.mockResolvedValue(user);
		logoutMock.mockResolvedValue();
		const store = createAuthStore();

		await store.login('maria@example.com', 'password123');
		await store.logout();

		expect(logoutMock).toHaveBeenCalledTimes(1);
		expect(get(store)).toMatchObject({
			user: null,
			isAuthenticated: false,
			isLoading: false
		});
	});

	it('clears the state even when the logout endpoint fails', async () => {
		loginMock.mockResolvedValue(user);
		logoutMock.mockRejectedValue(new Error('network'));
		const store = createAuthStore();

		await store.login('maria@example.com', 'password123');
		await store.logout();

		expect(get(store)).toMatchObject({
			user: null,
			isAuthenticated: false
		});
	});

	it('loads the current user from the session cookie', async () => {
		getCurrentUserMock.mockResolvedValue(user);
		const store = createAuthStore();

		const result = await store.loadCurrentUser();

		expect(getCurrentUserMock).toHaveBeenCalled();
		expect(result).toEqual(user);
		expect(get(store)).toMatchObject({
			user,
			isAuthenticated: true,
			isLoading: false
		});
	});

	it('clears auth state when loadCurrentUser fails', async () => {
		getCurrentUserMock.mockRejectedValue(new Error('Unauthorized'));
		const store = createAuthStore();

		await expect(store.loadCurrentUser()).rejects.toThrow('Unauthorized');

		expect(get(store)).toMatchObject({
			user: null,
			isAuthenticated: false,
			isLoading: false
		});
	});
});
