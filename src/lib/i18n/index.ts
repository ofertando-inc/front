import { writable, type Readable } from 'svelte/store';
import { defaultMessages, getCachedMessages, loadMessages } from '$lib/i18n/messages';
import { localeStore } from '$lib/i18n/store';
import type { Locale, TranslationMessages } from '$lib/i18n/types';

export { defaultLocale, localeStore } from '$lib/i18n/store';
export type { Locale, TranslationMessages } from '$lib/i18n/types';
export { SUPPORTED_LOCALES } from '$lib/i18n/types';

// Follows the locale, serving the default (es) synchronously and swapping in
// a lazily loaded locale as soon as its chunk arrives. A stale async load is
// discarded if the user switches again in between.
function createTranslationStore(): Readable<TranslationMessages> {
	const { subscribe, set } = writable<TranslationMessages>(defaultMessages);
	let current: Locale = 'es';

	localeStore.subscribe((locale) => {
		current = locale;
		const cached = getCachedMessages(locale);
		if (cached) {
			set(cached);
			return;
		}
		void loadMessages(locale).then((messages) => {
			if (current === locale) set(messages);
		});
	});

	return { subscribe };
}

export const translationStore = createTranslationStore();
