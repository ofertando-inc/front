import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'ofertando.theme';

function systemTheme(): Theme {
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
	document.documentElement.classList.toggle('dark', theme === 'dark');
}

// Follows the OS preference until the user makes an explicit choice with the
// header toggle; the choice is then persisted. An inline script in app.html
// applies the class before hydration so there is no flash of the wrong theme.
function createThemeStore() {
	const { subscribe, set } = writable<Theme>('light');

	return {
		subscribe,
		initialize() {
			if (!browser) return;

			const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
			const initial = stored === 'dark' || stored === 'light' ? stored : systemTheme();
			applyTheme(initial);
			set(initial);

			// Keep following the OS while the user has not chosen explicitly.
			window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
				if (localStorage.getItem(THEME_STORAGE_KEY)) return;
				const next: Theme = event.matches ? 'dark' : 'light';
				applyTheme(next);
				set(next);
			});
		},
		set(theme: Theme) {
			if (browser) {
				localStorage.setItem(THEME_STORAGE_KEY, theme);
				applyTheme(theme);
			}
			set(theme);
		}
	};
}

export const themeStore = createThemeStore();
