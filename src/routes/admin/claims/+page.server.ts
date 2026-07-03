import { requireRoot } from '$lib/server/admin/guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	await requireRoot(fetch);
};
