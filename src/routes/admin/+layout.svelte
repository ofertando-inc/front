<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { ChartOutline, FlagOutline, MessagesOutline, TagOutline } from 'flowbite-svelte-icons';
	import { translationStore } from '$lib/i18n';
	import { moderationSummary } from '$lib/stores/moderationSummary';
	import type { Component } from 'svelte';

	let { children, data } = $props();

	onMount(() => {
		void moderationSummary.load();
	});

	type AdminRoute = '/admin' | '/admin/offers' | '/admin/reports' | '/admin/comments';

	interface NavItem {
		routeId: AdminRoute;
		label: string;
		icon: Component;
		badge: number;
	}

	let items = $derived<NavItem[]>([
		{
			routeId: '/admin',
			label: $translationStore.admin.tabDashboard,
			icon: ChartOutline,
			badge: 0
		},
		{
			routeId: '/admin/offers',
			label: $translationStore.admin.tabOffers,
			icon: TagOutline,
			badge: 0
		},
		{
			routeId: '/admin/reports',
			label: $translationStore.admin.tabReports,
			icon: FlagOutline,
			badge: $moderationSummary?.pendingOfferReports ?? 0
		},
		{
			routeId: '/admin/comments',
			label: $translationStore.admin.tabComments,
			icon: MessagesOutline,
			badge: $moderationSummary?.pendingComments ?? 0
		}
	]);

	function isActive(routeId: AdminRoute): boolean {
		if (routeId === '/admin') return page.url.pathname === resolve('/admin');
		return page.url.pathname.startsWith(resolve(routeId));
	}

	let activeLabel = $derived(items.find((item) => isActive(item.routeId))?.label ?? '');
</script>

<svelte:head>
	<title>{$translationStore.admin.title} — {$translationStore.common.appName}</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-7xl gap-8 px-1 py-6 sm:py-10">
	<!-- Sidebar (desktop) -->
	<aside class="hidden w-60 shrink-0 lg:block">
		<div class="sticky top-6 flex flex-col gap-6">
			<div class="flex items-center gap-3 px-2">
				<span
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white shadow-sm"
				>
					<ChartOutline class="h-5 w-5" />
				</span>
				<div class="leading-tight">
					<p class="text-sm font-bold text-gray-900">{$translationStore.admin.brand}</p>
					<p class="truncate text-xs text-gray-500">{data.admin.username}</p>
				</div>
			</div>

			<nav class="flex flex-col gap-1" aria-label={$translationStore.admin.brand}>
				{#each items as item (item.routeId)}
					{@const active = isActive(item.routeId)}
					<a
						href={resolve(item.routeId)}
						aria-current={active ? 'page' : undefined}
						class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors {active
							? 'bg-primary-50 text-primary-700'
							: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}"
					>
						<item.icon
							class="h-5 w-5 {active
								? 'text-primary-600'
								: 'text-gray-400 group-hover:text-gray-600'}"
						/>
						<span class="flex-1">{item.label}</span>
						{#if item.badge > 0}
							<span
								class="inline-flex min-w-5 items-center justify-center rounded-full bg-primary-100 px-1.5 text-xs font-semibold text-primary-700 tabular-nums"
							>
								{item.badge}
							</span>
						{/if}
					</a>
				{/each}
			</nav>
		</div>
	</aside>

	<!-- Main -->
	<main class="min-w-0 flex-1">
		<!-- Mobile nav -->
		<nav
			class="mb-6 -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:hidden"
			aria-label={$translationStore.admin.brand}
		>
			{#each items as item (item.routeId)}
				{@const active = isActive(item.routeId)}
				<a
					href={resolve(item.routeId)}
					aria-current={active ? 'page' : undefined}
					class="flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors {active
						? 'bg-primary-500 text-white'
						: 'bg-white text-gray-600 hover:bg-gray-100'}"
				>
					<item.icon class="h-4 w-4" />
					{item.label}
					{#if item.badge > 0}
						<span
							class="inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums {active
								? 'bg-white/25 text-white'
								: 'bg-primary-100 text-primary-700'}"
						>
							{item.badge}
						</span>
					{/if}
				</a>
			{/each}
		</nav>

		<header class="mb-6">
			<h1 class="text-2xl font-extrabold text-gray-900 sm:text-3xl">{activeLabel}</h1>
		</header>

		{@render children()}
	</main>
</div>
