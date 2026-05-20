import {
	getCurrentUser,
	login as loginRequest,
	logout as logoutRequest,
	register as registerRequest
} from '$lib/api/auth';
import type { User } from '$lib/types/auth';
import { writable } from 'svelte/store';

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	isLoading: false
};

export function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(initialState);

	function applyUser(user: User) {
		set({
			user,
			isAuthenticated: true,
			isLoading: false
		});
	}

	return {
		subscribe,
		async login(email: string, password: string) {
			update((state) => ({ ...state, isLoading: true }));
			try {
				const user = await loginRequest({ email, password });
				applyUser(user);
				return user;
			} catch (error) {
				update((state) => ({ ...state, isLoading: false }));
				throw error;
			}
		},
		async register(email: string, username: string, password: string) {
			update((state) => ({ ...state, isLoading: true }));
			try {
				const user = await registerRequest({ email, username, password });
				applyUser(user);
				return user;
			} catch (error) {
				update((state) => ({ ...state, isLoading: false }));
				throw error;
			}
		},
		async logout() {
			// Best effort: even if the backend call fails (network, already expired),
			// always clear the client state so the UI is consistent.
			try {
				await logoutRequest();
			} catch {
				// Swallow — the cookie will expire naturally and the user can re-login.
			}
			set(initialState);
		},
		async loadCurrentUser() {
			update((state) => ({ ...state, isLoading: true }));
			try {
				const user = await getCurrentUser();
				applyUser(user);
				return user;
			} catch (error) {
				set(initialState);
				throw error;
			}
		}
	};
}

export const authStore = createAuthStore();
