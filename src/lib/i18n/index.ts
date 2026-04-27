import { derived } from 'svelte/store';
import { messages } from '$lib/i18n/messages';
import { localeStore } from '$lib/i18n/store';
import type { Locale } from '$lib/i18n/types';

export { defaultLocale, localeStore } from '$lib/i18n/store';
export { messages } from '$lib/i18n/messages';
export type { Locale, TranslationMessages } from '$lib/i18n/types';
export { SUPPORTED_LOCALES } from '$lib/i18n/types';

export const translationStore = derived(localeStore, ($locale) => messages[$locale]);

export function getMessages(locale: Locale) {
	return messages[locale];
}
