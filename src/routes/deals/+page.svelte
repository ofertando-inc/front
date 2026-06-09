<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { TagSolid } from 'flowbite-svelte-icons';
	import { ApiError } from '$lib/api/client';
	import DealCard from '$lib/components/offers/DealCard.svelte';
	import DealCardSkeleton from '$lib/components/offers/DealCardSkeleton.svelte';
	import DealFilters from '$lib/components/offers/DealFilters.svelte';
	import { listOffers } from '$lib/api/offers';
	import { ErrorKey } from '$lib/errors/errorKeys';
	import { resolveOfferError } from '$lib/offers/offerErrors';
	import { translationStore } from '$lib/i18n';
	import type { ListOffersQuery, Offer, OfferPeriod, OfferSort } from '$lib/types/offer';

	const CITIES = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Nacional'];
	const OFFER_TYPES = ['online', 'local'];
	const PAGE_LIMIT = 20;

	let cityFilter = $state<string>('');
	let typeFilter = $state<string>('');
	let sortFilter = $state<OfferSort>('date');
	let periodFilter = $state<OfferPeriod>('all');

	let offers = $state<Offer[]>([]);
	let cursor = $state<string | null>(null);
	let initialLoading = $state(true);
	let loadingMore = $state(false);
	let bannerError = $state<string | null>(null);

	let isEmpty = $derived(!initialLoading && offers.length === 0);

	function buildBaseQuery(): ListOffersQuery {
		return {
			sort: sortFilter,
			period: sortFilter === 'score' ? periodFilter : undefined,
			city: cityFilter || undefined,
			offerType: typeFilter || undefined,
			limit: PAGE_LIMIT
		};
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
</script>

<svelte:head>
	<title>{$translationStore.deals.listingTitle} — {$translationStore.common.appName}</title>
</svelte:head>

<section class="space-y-6">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
		<div class="flex items-center gap-3">
			<span
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-sm shadow-primary-500/30"
			>
				<TagSolid class="h-5 w-5 -rotate-90" />
			</span>
			<h1 class="font-display text-3xl font-extrabold tracking-tight text-gray-900">
				{$translationStore.deals.listingTitle}
			</h1>
		</div>
		<DealFilters
			cities={CITIES}
			offerTypes={OFFER_TYPES}
			bind:selectedCity={cityFilter}
			bind:selectedOfferType={typeFilter}
			bind:selectedSort={sortFilter}
			bind:selectedPeriod={periodFilter}
		/>
	</div>

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
