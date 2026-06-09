<script lang="ts">
	import { onMount } from 'svelte';
	import '@fontsource-variable/hanken-grotesk/index.css';
	import '@fontsource-variable/bricolage-grotesque/index.css';
	import './layout.css';
	import AppFooter from '$lib/components/layout/AppFooter.svelte';
	import AppHeader from '$lib/components/layout/AppHeader.svelte';
	import { authStore } from '$lib/stores/auth';
	import favicon from '$lib/assets/favicon.svg';
	import { localeStore } from '$lib/i18n';

	let { children } = $props();

	onMount(() => {
		localeStore.initialize();
		// loadCurrentUser triggers the cookie-based session probe. If the access
		// cookie is expired, the API client transparently refreshes via the
		// refresh cookie and retries; otherwise the user state stays empty.
		void authStore.loadCurrentUser().catch(() => {
			/* Anonymous visitor — leave the store empty. */
		});
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex min-h-screen flex-col">
	<AppHeader />
	<main class="page-shell flex-1">
		{@render children()}
	</main>
	<AppFooter />
</div>
