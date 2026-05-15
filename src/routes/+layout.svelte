<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import AppHeader from '$lib/components/layout/AppHeader.svelte';
	import { authStore } from '$lib/stores/auth';
	import favicon from '$lib/assets/favicon.svg';
	import { localeStore } from '$lib/i18n';

	let { children } = $props();

	onMount(() => {
		localeStore.initialize();
		authStore.initialize();
		void authStore.loadCurrentUser();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen">
	<AppHeader />
	<main class="page-shell">
		{@render children()}
	</main>
</div>
