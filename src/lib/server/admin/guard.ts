import { error, redirect } from '@sveltejs/kit';
import type { User } from '$lib/types/auth';

async function loadSessionUser(eventFetch: typeof fetch): Promise<User> {
	let response = await eventFetch('/api/users/me');

	if (response.status === 401) {
		const refreshResponse = await eventFetch('/api/auth/refresh', { method: 'POST' });
		if (refreshResponse.ok) {
			response = await eventFetch('/api/users/me');
		}
	}

	if (response.status === 401) {
		throw redirect(303, '/login');
	}

	if (!response.ok) {
		throw error(502, 'Unable to verify the current session.');
	}

	return (await response.json()) as User;
}

/**
 * Server-side admin guard for the /admin section. Probes the current session
 * through the BFF, transparently refreshing the access cookie once on 401.
 * Anonymous visitors are redirected to /login; authenticated non-admins get a
 * 403 so the layout never renders admin content for them. ROOT is a superset
 * of ADMIN for every moderation surface.
 */
export async function requireAdmin(eventFetch: typeof fetch): Promise<User> {
	const user = await loadSessionUser(eventFetch);

	if (user.role !== 'ADMIN' && user.role !== 'ROOT') {
		throw error(403, 'auth.forbidden');
	}

	return user;
}

/**
 * Guard for the ROOT-only surfaces (accounts, affiliation claims): a plain
 * ADMIN gets a 403 here, mirroring the backend's `auth.forbidden_root`.
 */
export async function requireRoot(eventFetch: typeof fetch): Promise<User> {
	const user = await loadSessionUser(eventFetch);

	if (user.role !== 'ROOT') {
		throw error(403, 'auth.forbidden_root');
	}

	return user;
}
