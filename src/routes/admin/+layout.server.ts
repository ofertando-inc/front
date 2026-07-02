import { requireAdmin } from '$lib/server/admin/guard';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ fetch }) => {
	const user = await requireAdmin(fetch);

	return {
		admin: { id: user.id, username: user.username, role: user.role }
	};
};
