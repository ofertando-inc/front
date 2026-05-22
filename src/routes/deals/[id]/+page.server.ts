import { fail, redirect } from '@sveltejs/kit';
import { getOwnedOffer } from '$lib/server/offers/access';
import { readBackendError, requireAuthenticated } from '$lib/server/offers/form';
import type { Actions } from './$types';

interface DeleteFailure {
	deleteError: string;
}

function deleteFailure(status: number, deleteError: string) {
	return fail<DeleteFailure>(status, { deleteError });
}

function getDeleteErrorKey(status: number, payload: { key?: unknown }): string {
	if (typeof payload.key === 'string') return payload.key;
	if (status === 404) return 'offer.not_found';
	if (status === 403) return 'offer.forbidden';
	return 'deleteDeal.genericError';
}

export const actions: Actions = {
	delete: async ({ fetch, params }) => {
		const user = await requireAuthenticated(fetch);
		const ownedOffer = await getOwnedOffer(fetch, params.id, user);

		if (!ownedOffer.ok) {
			return deleteFailure(ownedOffer.status, ownedOffer.errorKey);
		}

		const response = await fetch(`/api/offers/${encodeURIComponent(params.id)}`, {
			method: 'DELETE'
		});

		if (response.status === 401) {
			throw redirect(303, '/login');
		}

		if (!response.ok) {
			const payload = await readBackendError(response);
			return deleteFailure(response.status, getDeleteErrorKey(response.status, payload));
		}

		throw redirect(303, '/deals');
	}
};
