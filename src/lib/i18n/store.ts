import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { Locale } from '$lib/i18n/types';

const LOCALE_STORAGE_KEY = 'ofertando.locale';
const DEFAULT_LOCALE: Locale = 'es';

function createLocaleStore() {
	const { subscribe, set } = writable<Locale>(DEFAULT_LOCALE);

	return {
		subscribe,
		initialize() {
			if (!browser) return;

			const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
			if (storedLocale) {
				set(storedLocale);
			}
		},
		set(locale: Locale) {
			if (browser) {
				localStorage.setItem(LOCALE_STORAGE_KEY, locale);
			}

			set(locale);
		},
		reset() {
			if (browser) {
				localStorage.removeItem(LOCALE_STORAGE_KEY);
			}

			set(DEFAULT_LOCALE);
		}
	};
}

export const localeStore = createLocaleStore();
export const defaultLocale = DEFAULT_LOCALE;
