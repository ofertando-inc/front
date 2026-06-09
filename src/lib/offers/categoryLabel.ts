import type { TranslationMessages } from '$lib/i18n/types';

/**
 * Localized label for a category slug. The slug is the stable join key with the
 * backend seed, so an unknown slug falls back to the backend-provided name.
 */
export function categoryLabel(t: TranslationMessages, slug: string, fallback: string): string {
	return (t.categories as Record<string, string>)[slug] ?? fallback;
}
