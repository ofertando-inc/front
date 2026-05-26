<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { Button } from 'flowbite-svelte';
	import { ArrowRightOutline, FireSolid } from 'flowbite-svelte-icons';
	import DealCard from '$lib/components/offers/DealCard.svelte';
	import DealCardSkeleton from '$lib/components/offers/DealCardSkeleton.svelte';
	import { listOffers } from '$lib/api/offers';
	import { MOCK_POPULAR_STORES } from '$lib/data/mockDeals';
	import { translationStore } from '$lib/i18n';
	import type { Offer } from '$lib/types/offer';

	let hotDeals = $state<Offer[]>([]);
	let recentDeals = $state<Offer[]>([]);
	let hotLoading = $state(true);
	let recentLoading = $state(true);

	onMount(async () => {
		try {
			const hot = await listOffers({ sort: 'score', period: 'week', limit: 3 });
			hotDeals = hot.items;
		} catch {
			hotDeals = [];
		} finally {
			hotLoading = false;
		}

		try {
			const recent = await listOffers({ sort: 'date', limit: 6 });
			recentDeals = recent.items;
		} catch {
			recentDeals = [];
		} finally {
			recentLoading = false;
		}
	});
</script>

<svelte:head>
	<title>{$translationStore.common.appName}</title>
</svelte:head>

<div class="space-y-12">
	<section
		class="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm md:p-12"
	>
		<div
			class="pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-primary-100 opacity-50 blur-3xl"
		></div>
		<div class="relative z-10 max-w-3xl space-y-6">
			<h1 class="text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
				{$translationStore.home.heroTitle}
			</h1>
			<p class="max-w-2xl text-lg text-gray-600">
				{$translationStore.home.heroSubtitle}
			</p>
			<div class="flex flex-wrap gap-3">
				<Button href={resolve('/deals')} class="rounded-full px-6 py-3">
					{$translationStore.home.exploreCta}
				</Button>
				<Button href={resolve('/create-deal')} color="alternative" class="rounded-full px-6 py-3">
					{$translationStore.home.publishCta}
				</Button>
			</div>
		</div>
	</section>

	<section>
		<div class="mb-6 flex items-center justify-between">
			<h2 class="flex items-center gap-2 text-2xl font-bold text-gray-900">
				<FireSolid class="h-6 w-6 text-primary-500" />
				{$translationStore.home.hotDealsTitle}
			</h2>
			<a
				href={resolve('/deals')}
				class="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
			>
				{$translationStore.home.viewAll}
				<ArrowRightOutline class="h-4 w-4" />
			</a>
		</div>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#if hotLoading}
				{#each [0, 1, 2] as i (i)}
					<DealCardSkeleton />
				{/each}
			{:else}
				{#each hotDeals as deal (deal.id)}
					<DealCard offer={deal} />
				{/each}
			{/if}
		</div>
	</section>

	<section>
		<h2 class="mb-6 text-2xl font-bold text-gray-900">
			{$translationStore.home.recentDealsTitle}
		</h2>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#if recentLoading}
				{#each [0, 1, 2, 3, 4, 5] as i (i)}
					<DealCardSkeleton />
				{/each}
			{:else}
				{#each recentDeals as deal (deal.id)}
					<DealCard offer={deal} />
				{/each}
			{/if}
		</div>
	</section>

	<section class="border-t border-gray-200 pt-12">
		<h2 class="mb-6 text-center text-xl font-bold text-gray-900">
			{$translationStore.home.popularStoresTitle}
		</h2>
		<div class="flex flex-wrap justify-center gap-4 md:gap-8">
			{#each MOCK_POPULAR_STORES as store (store)}
				<div
					class="cursor-default rounded-xl border border-gray-200 bg-white px-6 py-4 font-semibold text-gray-600 shadow-sm transition-colors hover:border-primary-300 hover:text-primary-600"
				>
					{store}
				</div>
			{/each}
		</div>
	</section>
</div>
