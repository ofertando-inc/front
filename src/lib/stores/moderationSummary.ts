import { writable } from 'svelte/store';
import { getModerationSummary } from '$lib/api/admin';
import type { ModerationSummary } from '$lib/types/admin';

/**
 * Shared moderation counts, loaded once when the /admin shell mounts and read
 * by both the sidebar badges and the dashboard cards. Stays null until loaded
 * (or on failure) so the UI can degrade gracefully.
 */
function createModerationSummaryStore() {
	const { subscribe, set } = writable<ModerationSummary | null>(null);

	return {
		subscribe,
		async load() {
			try {
				set(await getModerationSummary());
			} catch {
				set(null);
			}
		}
	};
}

export const moderationSummary = createModerationSummaryStore();
