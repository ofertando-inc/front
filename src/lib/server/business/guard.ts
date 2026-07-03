import { error, redirect } from '@sveltejs/kit';
import type { User } from '$lib/types/auth';
import type { BusinessMe } from '$lib/types/business';

/**
 * Server-side guard for the /business section. Probes the session through the
 * BFF (refreshing the access cookie once on 401), redirects anonymous
 * visitors to /login and rejects non-business accounts with a 403 mirroring
 * the backend's `account.not_business`.
 */
export async function requireBusiness(eventFetch: typeof fetch): Promise<User> {
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

	if (user.accountType !== 'BUSINESS') {
		throw error(403, 'account.not_business');
	}

	return user;
}

/**
 * Loads the business profile, or null while the affiliation is still pending
 * (403 `account.no_affiliation`) so the caller can render a waiting state
 * instead of an error page.
 */
export async function fetchBusinessMe(eventFetch: typeof fetch): Promise<BusinessMe | null> {
	const response = await eventFetch('/api/business/me');
	if (response.status === 403) return null;
	if (!response.ok) {
		throw error(502, 'Unable to load the business profile.');
	}
	return (await response.json()) as BusinessMe;
}
