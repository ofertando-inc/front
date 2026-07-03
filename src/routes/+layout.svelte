<script lang="ts">
	import { onMount } from 'svelte';
	import '@fontsource-variable/hanken-grotesk/index.css';
	import '@fontsource-variable/bricolage-grotesque/index.css';
	import './layout.css';
	import './dark.css';
	import AppFooter from '$lib/components/layout/AppFooter.svelte';
	import AppHeader from '$lib/components/layout/AppHeader.svelte';
	import { authStore } from '$lib/stores/auth';
	import { themeStore } from '$lib/stores/theme';
	import favicon from '$lib/assets/favicon.svg';
	import { localeStore, translationStore } from '$lib/i18n';

	let { children } = $props();

	onMount(() => {
		localeStore.initialize();
		themeStore.initialize();
		// loadCurrentUser triggers the cookie-based session probe. If the access
		// cookie is expired, the API client transparently refreshes via the
		// refresh cookie and retries; otherwise the user state stays empty.
		void authStore.loadCurrentUser().catch(() => {
			/* Anonymous visitor — leave the store empty. */
		});
	});

	// RGAA: the document language must follow the interface language so screen
	// readers switch voices (app.html ships the default `es`).
	$effect(() => {
		document.documentElement.lang = $localeStore;
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex min-h-screen flex-col">
	<!-- Skip link: first focusable element, only visible while focused. -->
	<a
		href="#main-content"
		class="sr-only rounded-full focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-primary-600 focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
	>
		{$translationStore.common.skipToContent}
	</a>
	<AppHeader />
	<main id="main-content" tabindex="-1" class="page-shell flex-1 focus:outline-none">
		{@render children()}
	</main>
	<AppFooter />
</div>
