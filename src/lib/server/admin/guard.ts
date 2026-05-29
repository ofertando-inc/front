import { error, redirect } from '@sveltejs/kit';
import type { User } from '$lib/types/auth';

/**
 * Server-side admin guard for the /admin section. Probes the current session
 * through the BFF, transparently refreshing the access cookie once on 401.
 * Anonymous visitors are redirected to /login; authenticated non-admins get a
 * 403 so the layout never renders admin content for them.
 */
export async function requireAdmin(eventFetch: typeof fetch): Promise<User> {
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

	const user = (await response.json()) as User;

	if (user.role !== 'ADMIN') {
		throw error(403, 'auth.forbidden');
	}

	return user;
}
