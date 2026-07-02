import { requireBusiness } from '$lib/server/business/guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	await requireBusiness(fetch);
};
