import { apiRequest } from '$lib/api/client';
import type { Category } from '$lib/types/offer';

export function getCategories() {
	return apiRequest<Category[]>('/categories', {
		method: 'GET'
	});
}
