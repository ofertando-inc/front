import { browser } from '$app/environment';
import { getCurrentUser, login as loginRequest, register as registerRequest } from '$lib/api/auth';
import type { AuthResponse, User } from '$lib/types/auth';
import { writable } from 'svelte/store';

export const AUTH_TOKEN_KEY = 'ofertando.accessToken';

interface AuthState {
	accessToken: string | null;
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

const initialState: AuthState = {
	accessToken: null,
	user: null,
	isAuthenticated: false,
	isLoading: false
};

export function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(initialState);

	function applyAuth(response: AuthResponse) {
		if (browser) {
			localStorage.setItem(AUTH_TOKEN_KEY, response.accessToken);
		}

		set({
			accessToken: response.accessToken,
			user: response.user,
			isAuthenticated: true,
			isLoading: false
		});
	}

	return {
		subscribe,
		initialize() {
			if (!browser) return;

			const token = localStorage.getItem(AUTH_TOKEN_KEY);
			if (!token) return;

			update((state) => ({
				...state,
				accessToken: token,
				isAuthenticated: true
			}));
		},
		async login(email: string, password: string) {
			update((state) => ({ ...state, isLoading: true }));

			try {
				const response = await loginRequest({ email, password });
				applyAuth(response);
				return response.user;
			} catch (error) {
				update((state) => ({ ...state, isLoading: false }));
				throw error;
			}
		},
		async register(email: string, username: string, password: string) {
			update((state) => ({ ...state, isLoading: true }));

			try {
				const response = await registerRequest({ email, username, password });
				applyAuth(response);
				return response.user;
			} catch (error) {
				update((state) => ({ ...state, isLoading: false }));
				throw error;
			}
		},
		logout() {
			if (browser) {
				localStorage.removeItem(AUTH_TOKEN_KEY);
			}

			set(initialState);
		},
		async loadCurrentUser() {
			let token: string | null = null;

			update((state) => {
				token = state.accessToken;
				return { ...state, isLoading: true };
			});

			if (!token) {
				update((state) => ({ ...state, isLoading: false, isAuthenticated: false }));
				return null;
			}

			try {
				const user = await getCurrentUser(token);
				update((state) => ({
					...state,
					user,
					isAuthenticated: true,
					isLoading: false
				}));
				return user;
			} catch (error) {
				if (browser) {
					localStorage.removeItem(AUTH_TOKEN_KEY);
				}

				set(initialState);
				throw error;
			}
		}
	};
}

export const authStore = createAuthStore();
