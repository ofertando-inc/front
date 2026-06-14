<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from 'flowbite-svelte';
	import { TagSolid, CloseOutline } from 'flowbite-svelte-icons';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { ApiError } from '$lib/api/client';
	import DealCard from '$lib/components/offers/DealCard.svelte';
	import DealCardSkeleton from '$lib/components/offers/DealCardSkeleton.svelte';
	import DealFilters from '$lib/components/offers/DealFilters.svelte';
	import { getOfferFacets, listOffers } from '$lib/api/offers';
	import { ErrorKey } from '$lib/errors/errorKeys';
	import { resolveOfferError } from '$lib/offers/offerErrors';
	import { translationStore } from '$lib/i18n';
	import type {
		ListOffersQuery,
		Offer,
		OfferFacets,
		OfferPeriod,
		OfferSort
	} from '$lib/types/offer';

	const PAGE_LIMIT = 20;
	const NEAR_RADIUS_KM = 10;

	let cityFilter = $state<string>('');
	let categoryFilter = $state<string>('');
	// Channel filter: '' (all) | 'online' | 'local'.
	let channelFilter = $state<string>('');
	// "Near me": "lat,lng" once a position is granted, '' otherwise.
	let nearFilter = $state<string>('');
	let sortFilter = $state<OfferSort>('date');
	let periodFilter = $state<OfferPeriod>('all');
	let hideExpired = $state(false);

	// Filter values come from the backend so the dropdowns reflect the live
	// catalogue (cities / stores that actually have offers) with match counts.
	let facets = $state<OfferFacets | null>(null);

	// The search term is URL-driven so the global header search can deep-link
	// into the listing (`/deals?q=…`) and the back button stays meaningful.
	let searchQuery = $derived(page.url.searchParams.get('q') ?? '');

	let offers = $state<Offer[]>([]);
	let cursor = $state<string | null>(null);
	let total = $state(0);
	let initialLoading = $state(true);
	let loadingMore = $state(false);
	let bannerError = $state<string | null>(null);

	let isEmpty = $derived(!initialLoading && offers.length === 0);

	function buildBaseQuery(): ListOffersQuery {
		return {
			q: searchQuery || undefined,
			sort: sortFilter,
			period: sortFilter === 'score' ? periodFilter : undefined,
			city: cityFilter || undefined,
			category: categoryFilter || undefined,
			online: channelFilter === '' ? undefined : channelFilter === 'online',
			near: nearFilter || undefined,
			radiusKm: nearFilter ? NEAR_RADIUS_KM : undefined,
			includeExpired: hideExpired ? false : undefined,
			limit: PAGE_LIMIT
		};
	}

	function clearSearch() {
		void goto(resolve('/deals'));
	}

	async function loadFirstPage(query: ListOffersQuery) {
		initialLoading = true;
		bannerError = null;
		cursor = null;
		offers = [];

		try {
			const res = await listOffers(query);
			offers = res.items;
			cursor = res.nextCursor;
			total = res.total;
		} catch (err) {
			handleError(err, query);
		} finally {
			initialLoading = false;
		}
	}

	async function loadMore() {
		if (loadingMore || !cursor) return;
		const query: ListOffersQuery = { ...buildBaseQuery(), cursor };
		loadingMore = true;
		bannerError = null;

		try {
			const res = await listOffers(query);
			offers = [...offers, ...res.items];
			cursor = res.nextCursor;
			total = res.total;
		} catch (err) {
			handleError(err, query);
		} finally {
			loadingMore = false;
		}
	}

	function handleError(err: unknown, attemptedQuery: ListOffersQuery) {
		if (err instanceof ApiError && err.key === ErrorKey.PaginationInvalidCursor) {
			void loadFirstPage({ ...attemptedQuery, cursor: undefined });
			return;
		}
		const resolved = resolveOfferError(err, $translationStore, 'browse');
		bannerError = resolved.bannerMessage;
	}

	$effect(() => {
		void loadFirstPage(buildBaseQuery());
	});

	onMount(async () => {
		try {
			facets = await getOfferFacets();
		} catch {
			// Facets are progressive enhancement — the dropdowns simply stay empty.
			facets = null;
		}
	});
</script>

<svelte:head>
	<title>{$translationStore.deals.listingTitle} — {$translationStore.common.appName}</title>
</svelte:head>

<section class="space-y-6">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
		<h1 class="font-display text-3xl font-extrabold tracking-tight text-gray-900">
			{$translationStore.deals.listingTitle}
		</h1>
		<DealFilters
			cities={facets?.cities ?? []}
			categories={facets?.categories ?? []}
			bind:selectedCity={cityFilter}
			bind:selectedCategory={categoryFilter}
			bind:selectedChannel={channelFilter}
			bind:selectedNear={nearFilter}
			bind:selectedSort={sortFilter}
			bind:selectedPeriod={periodFilter}
			bind:hideExpired
		/>
	</div>

	{#if !initialLoading && !bannerError}
		<div class="flex flex-wrap items-center gap-3 text-sm text-gray-500">
			<span class="tabular-nums">
				{$translationStore.deals.resultsCount.replace('{count}', String(total))}
			</span>
			{#if searchQuery}
				<span
					class="inline-flex items-center gap-2 rounded-full bg-orange-50 py-1 pr-1.5 pl-3 font-medium text-primary-700"
				>
					{$translationStore.deals.searchResultsFor}
					<span class="font-semibold">“{searchQuery}”</span>
					<button
						type="button"
						onclick={clearSearch}
						aria-label={$translationStore.deals.clearSearch}
						class="flex h-5 w-5 items-center justify-center rounded-full text-primary-600 transition-colors hover:bg-primary-100"
					>
						<CloseOutline class="h-3.5 w-3.5" />
					</button>
				</span>
			{/if}
		</div>
	{/if}

	{#if bannerError}
		<p
			role="alert"
			class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
		>
			{bannerError}
		</p>
	{/if}

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#if initialLoading}
			{#each [0, 1, 2, 3, 4, 5] as i (i)}
				<DealCardSkeleton />
			{/each}
		{:else}
			{#each offers as offer (offer.id)}
				<DealCard {offer} />
			{/each}
		{/if}
	</div>

	{#if isEmpty}
		<div class="rounded-2xl border border-orange-100 bg-white p-10 text-center">
			<div
				class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-primary-400"
			>
				<TagSolid class="h-6 w-6 -rotate-90" />
			</div>
			<p class="text-gray-500">{$translationStore.deals.empty}</p>
		</div>
	{/if}

	{#if !initialLoading && cursor}
		<div class="flex justify-center pt-4">
			<Button
				color="alternative"
				class="rounded-full px-6"
				disabled={loadingMore}
				onclick={loadMore}
			>
				{loadingMore ? $translationStore.common.loading : $translationStore.deals.loadMore}
			</Button>
		</div>
	{/if}
</section>
