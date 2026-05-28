<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { translationStore } from '$lib/i18n';

	let { children } = $props();

	let tabs = $derived([
		{ href: resolve('/admin'), label: $translationStore.admin.tabOffers },
		{ href: resolve('/admin/reports'), label: $translationStore.admin.tabReports }
	]);

	function isActive(href: string): boolean {
		if (href === resolve('/admin')) {
			return page.url.pathname === href;
		}
		return page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<title>{$translationStore.admin.title} — {$translationStore.common.appName}</title>
</svelte:head>

<section class="mx-auto w-full max-w-7xl py-6 sm:py-10">
	<header class="mb-6 space-y-2">
		<h1 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
			{$translationStore.admin.title}
		</h1>
		<p class="text-base text-gray-600">{$translationStore.admin.subtitle}</p>
	</header>

	<nav class="mb-6 flex gap-1 border-b border-gray-200" aria-label={$translationStore.admin.title}>
		{#each tabs as tab (tab.href)}
			<a
				href={tab.href}
				aria-current={isActive(tab.href) ? 'page' : undefined}
				class="border-b-2 px-4 py-3 text-sm font-medium transition-colors {isActive(tab.href)
					? 'border-primary-500 text-primary-600'
					: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
			>
				{tab.label}
			</a>
		{/each}
	</nav>

	{@render children()}
</section>
