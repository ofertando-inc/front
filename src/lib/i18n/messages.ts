import { es } from '$lib/i18n/locales/es';
import type { Locale, TranslationMessages } from '$lib/i18n/types';

// Only the default locale ships in the initial bundle; the other two are
// code-split and fetched on demand when the user switches language. This
// keeps ~2/3 of the translation payload off the critical path.
const loaders: Record<Exclude<Locale, 'es'>, () => Promise<TranslationMessages>> = {
	en: () => import('$lib/i18n/locales/en').then((module) => module.en),
	fr: () => import('$lib/i18n/locales/fr').then((module) => module.fr)
};

const cache = new Map<Locale, TranslationMessages>([['es', es]]);

export const defaultMessages = es;

export function getCachedMessages(locale: Locale): TranslationMessages | undefined {
	return cache.get(locale);
}

export async function loadMessages(locale: Locale): Promise<TranslationMessages> {
	const cached = cache.get(locale);
	if (cached) return cached;

	const loaded = await loaders[locale as Exclude<Locale, 'es'>]();
	cache.set(locale, loaded);
	return loaded;
}
