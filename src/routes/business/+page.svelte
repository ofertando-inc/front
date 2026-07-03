<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { Button, Label, Modal, Spinner, Tooltip } from 'flowbite-svelte';
	import {
		ArrowUpRightFromSquareOutline,
		BadgeCheckSolid,
		CheckCircleOutline,
		EyeOutline,
		FlagOutline,
		GlobeOutline,
		InfoCircleOutline,
		MapPinOutline,
		MessagesOutline,
		PlusOutline,
		TagOutline,
		ThumbsUpOutline
	} from 'flowbite-svelte-icons';
	import { getBusinessMe, getBusinessStats, requestLocation } from '$lib/api/business';
	import { getMyOffers } from '$lib/api/offers';
	import { ApiError } from '$lib/api/client';
	import AddressCombobox from '$lib/components/offers/AddressCombobox.svelte';
	import CityCombobox from '$lib/components/offers/CityCombobox.svelte';
	import DealCard from '$lib/components/offers/DealCard.svelte';
	import LocationMapPicker from '$lib/components/offers/LocationMapPicker.svelte';
	import { ErrorKey } from '$lib/errors/errorKeys';
	import { localeStore, translationStore } from '$lib/i18n';
	import { normalizeCity } from '$lib/offers/cities';
	import { resolveOfferError } from '$lib/offers/offerErrors';
	import type { BusinessMe, BusinessStats } from '$lib/types/business';
	import type { Offer } from '$lib/types/offer';

	let me = $state<BusinessMe | null>(null);
	let stats = $state<BusinessStats | null>(null);
	let myOffers = $state<Offer[]>([]);
	let loading = $state(true);
	// BUSINESS account whose affiliation has not been approved yet.
	let pendingAffiliation = $state(false);
	let errorMessage = $state<string | null>(null);

	let dateFormatter = $derived(
		new Intl.DateTimeFormat($localeStore, { day: 'numeric', month: 'short', year: 'numeric' })
	);

	// The six metrics as data so each card carries its icon and an explanatory
	// tooltip (what exactly is counted — e.g. own visits are excluded).
	let statCards = $derived(
		stats
			? [
					{
						key: 'offers',
						icon: TagOutline,
						value: stats.offers.active,
						label: $translationStore.business.statActiveOffers.replace(
							'{total}',
							String(stats.offers.total)
						),
						hint: $translationStore.business.statActiveOffersHint,
						accent: true
					},
					{
						key: 'views',
						icon: EyeOutline,
						value: stats.views,
						label: $translationStore.business.statViews,
						hint: $translationStore.business.statViewsHint,
						accent: false
					},
					{
						key: 'clicks',
						icon: ArrowUpRightFromSquareOutline,
						value: stats.clicks,
						label: $translationStore.business.statClicks,
						hint: $translationStore.business.statClicksHint,
						accent: false
					},
					{
						key: 'score',
						icon: ThumbsUpOutline,
						value: stats.score,
						label: $translationStore.business.statScore,
						hint: $translationStore.business.statScoreHint,
						accent: false
					},
					{
						key: 'comments',
						icon: MessagesOutline,
						value: stats.comments,
						label: $translationStore.business.statComments,
						hint: $translationStore.business.statCommentsHint,
						accent: false
					},
					{
						key: 'reports',
						icon: FlagOutline,
						value: stats.reports,
						label: $translationStore.business.statReports,
						hint: $translationStore.business.statReportsHint,
						accent: false
					}
				]
			: []
	);

	// Filter the loaded offers by channel/address ('all' | 'online' | location id).
	let offerFilter = $state('all');

	let offerFilters = $derived.by(() => {
		const filters = [{ value: 'all', label: $translationStore.business.filterAllOffers }];
		if (myOffers.some((offer) => offer.isOnline)) {
			filters.push({ value: 'online', label: $translationStore.deals.typeOnline });
		}
		const seen: string[] = [];
		for (const offer of myOffers) {
			if (offer.location && !seen.includes(offer.location.id)) {
				seen.push(offer.location.id);
				filters.push({ value: offer.location.id, label: offer.location.address });
			}
		}
		return filters;
	});

	let visibleOffers = $derived(
		myOffers.filter((offer) => {
			if (offerFilter === 'all') return true;
			if (offerFilter === 'online') return offer.isOnline;
			return offer.location?.id === offerFilter;
		})
	);

	onMount(() => void load());

	async function load() {
		loading = true;
		errorMessage = null;
		try {
			me = await getBusinessMe();
		} catch (error) {
			if (error instanceof ApiError && error.key === ErrorKey.AccountNoAffiliation) {
				pendingAffiliation = true;
				loading = false;
				return;
			}
			errorMessage = resolveOfferError(error, $translationStore, 'browse').bannerMessage;
			loading = false;
			return;
		}

		try {
			const [fetchedStats, offers] = await Promise.all([
				getBusinessStats(),
				getMyOffers({ limit: 24, includeExpired: true })
			]);
			stats = fetchedStats;
			myOffers = offers.items;
		} catch (error) {
			errorMessage = resolveOfferError(error, $translationStore, 'browse').bannerMessage;
		} finally {
			loading = false;
		}
	}

	// --- Request-location dialog ---
	let locationOpen = $state(false);
	let locationCity = $state('');
	let locationAddress = $state('');
	let locationRegion = $state('');
	let locationLatitude = $state<number | undefined>(undefined);
	let locationLongitude = $state<number | undefined>(undefined);
	let locationSubmitting = $state(false);
	let locationError = $state<string | null>(null);
	let locationSuccess = $state(false);
	let canRequestLocation = $derived(Boolean(locationAddress.trim() && locationCity.trim()));

	function openLocationDialog() {
		locationCity = '';
		locationAddress = '';
		locationRegion = '';
		locationLatitude = undefined;
		locationLongitude = undefined;
		locationError = null;
		locationOpen = true;
	}

	async function confirmRequestLocation() {
		if (!canRequestLocation || locationSubmitting) return;
		locationSubmitting = true;
		locationError = null;
		try {
			const city = locationCity.trim();
			await requestLocation({
				address: locationAddress.trim(),
				city: normalizeCity(city) ?? city,
				region: locationRegion.trim() || undefined,
				latitude: locationLatitude,
				longitude: locationLongitude
			});
			locationOpen = false;
			locationSuccess = true;
		} catch (error) {
			if (error instanceof ApiError) {
				const key = error.key;
				if (key && key in $translationStore.errors) {
					locationError = $translationStore.errors[key as keyof typeof $translationStore.errors];
				}
			}
			locationError ??= $translationStore.errors.fallback;
		} finally {
			locationSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>{$translationStore.business.title} — {$translationStore.common.appName}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-1 py-6 sm:py-10">
	<header class="space-y-1">
		<p class="text-sm font-semibold tracking-[0.2em] text-primary-700 uppercase">
			{$translationStore.common.appName}
		</p>
		<h1 class="text-2xl font-extrabold text-gray-900 sm:text-3xl">
			{$translationStore.business.title}
		</h1>
	</header>

	{#if errorMessage}
		<p
			role="alert"
			class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
		>
			{errorMessage}
		</p>
	{/if}

	{#if loading}
		<div class="flex justify-center py-16"><Spinner /></div>
	{:else if pendingAffiliation}
		<div class="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
			<p class="font-semibold text-amber-800">{$translationStore.business.pendingTitle}</p>
			<p class="pt-1 text-sm leading-6 text-amber-700">
				{$translationStore.business.pendingBody}
			</p>
		</div>
	{:else if me}
		<!-- Affiliation banner -->
		<div
			class="flex flex-wrap items-center gap-3 rounded-2xl border border-savings-100 bg-savings-50 px-5 py-4"
		>
			<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-savings-600 text-white">
				<BadgeCheckSolid class="h-5 w-5" />
			</span>
			<div class="leading-tight">
				<p class="text-sm text-savings-700">{$translationStore.business.affiliatedTo}</p>
				<p class="flex items-center gap-1 font-bold text-gray-900">
					{me.merchant.name}
					{#if me.merchant.verified}
						<CheckCircleOutline class="h-4 w-4 text-savings-600" />
					{/if}
				</p>
			</div>
			{#if me.claim.resolvedAt}
				<p class="ml-auto text-sm text-savings-700">
					{$translationStore.business.affiliatedSince}
					{dateFormatter.format(new Date(me.claim.resolvedAt))}
				</p>
			{/if}
		</div>

		{#if locationSuccess}
			<p
				role="status"
				class="rounded-2xl border border-savings-100 bg-savings-50 px-4 py-3 text-sm text-savings-700"
			>
				{$translationStore.business.requestLocationSuccess}
			</p>
		{/if}

		<!-- Stats -->
		{#if stats}
			<section class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
				{#each statCards as card (card.key)}
					<div
						class="relative rounded-2xl border p-4 {card.accent
							? 'border-orange-100 bg-orange-50'
							: 'border-gray-100 bg-white shadow-sm'}"
					>
						<button
							type="button"
							id="stat-info-{card.key}"
							class="absolute top-3 right-3 text-gray-300 transition-colors hover:text-gray-500"
							aria-label={card.label}
						>
							<InfoCircleOutline class="h-4 w-4" />
						</button>
						<Tooltip triggeredBy="#stat-info-{card.key}" class="max-w-56 text-center">
							{card.hint}
						</Tooltip>
						<span
							class="mb-2 flex h-8 w-8 items-center justify-center rounded-lg {card.accent
								? 'bg-primary-700 text-white'
								: 'bg-gray-100 text-gray-500'}"
						>
							<card.icon class="h-4 w-4" />
						</span>
						<span
							class="block text-2xl font-bold tabular-nums {card.accent
								? 'text-primary-600'
								: 'text-gray-900'}"
						>
							{card.value}
						</span>
						<span class="text-sm text-gray-500">{card.label}</span>
					</div>
				{/each}
			</section>
		{/if}

		<!-- Actions -->
		<div class="flex flex-wrap gap-3">
			<Button href={resolve('/business/new-offer')} class="rounded-full">
				<span class="flex items-center gap-2">
					<PlusOutline class="h-4 w-4" />
					{$translationStore.business.publishOfficial}
				</span>
			</Button>
			<Button color="alternative" class="rounded-full" onclick={openLocationDialog}>
				<span class="flex items-center gap-2">
					<MapPinOutline class="h-4 w-4" />
					{$translationStore.business.requestLocation}
				</span>
			</Button>
		</div>

		<!-- My offers -->
		<section class="space-y-3">
			<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
				<h2 class="font-bold text-gray-900">{$translationStore.business.myOffers}</h2>
				<p class="text-sm text-gray-500">{$translationStore.business.myOffersSubtitle}</p>
			</div>

			{#if offerFilters.length > 1}
				<div class="flex flex-wrap gap-2">
					{#each offerFilters as filter (filter.value)}
						<button
							type="button"
							onclick={() => (offerFilter = filter.value)}
							aria-pressed={offerFilter === filter.value}
							class="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors {offerFilter ===
							filter.value
								? 'border-primary-700 bg-primary-700 text-white'
								: 'border-gray-300 bg-white text-gray-600 hover:border-primary-300'}"
						>
							{#if filter.value === 'online'}
								<GlobeOutline class="h-3.5 w-3.5" />
							{:else if filter.value !== 'all'}
								<MapPinOutline class="h-3.5 w-3.5" />
							{/if}
							{filter.label}
						</button>
					{/each}
				</div>
			{/if}

			{#if myOffers.length === 0}
				<p
					class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-500"
				>
					{$translationStore.business.myOffersEmpty}
				</p>
			{:else if visibleOffers.length === 0}
				<p
					class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-500"
				>
					{$translationStore.business.myOffersFilterEmpty}
				</p>
			{:else}
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each visibleOffers as offer (offer.id)}
						<DealCard {offer} />
					{/each}
				</div>
			{/if}
		</section>
	{/if}
</div>

<!-- Request a new address -->
<Modal bind:open={locationOpen} title={$translationStore.business.requestLocationTitle} size="md">
	<div class="space-y-4">
		<p class="text-sm leading-6 text-gray-600">{$translationStore.business.requestLocationHint}</p>
		<div class="space-y-2">
			<Label for="bizLocationCity" class="text-sm font-medium text-gray-700">
				{$translationStore.createDeal.cityLabel} *
			</Label>
			<CityCombobox
				id="bizLocationCity"
				bind:value={locationCity}
				placeholder={$translationStore.createDeal.cityPlaceholder}
				required
			/>
		</div>
		{#if locationCity}
			<div class="space-y-2">
				<Label for="bizLocationAddress" class="text-sm font-medium text-gray-700">
					{$translationStore.createDeal.addressLabel} *
				</Label>
				<AddressCombobox
					id="bizLocationAddress"
					bind:address={locationAddress}
					bind:region={locationRegion}
					bind:latitude={locationLatitude}
					bind:longitude={locationLongitude}
					cityHint={locationCity}
					required
				/>
			</div>
		{/if}
		{#if locationAddress}
			<LocationMapPicker
				bind:latitude={locationLatitude}
				bind:longitude={locationLongitude}
				onLocate={(place) => (locationRegion = place.region)}
			/>
		{/if}
		{#if locationError}
			<p class="text-sm text-red-600">{locationError}</p>
		{/if}
	</div>
	{#snippet footer()}
		<div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
			<Button
				color="alternative"
				disabled={locationSubmitting}
				onclick={() => (locationOpen = false)}
			>
				{$translationStore.admin.cancel}
			</Button>
			<Button disabled={!canRequestLocation || locationSubmitting} onclick={confirmRequestLocation}>
				{locationSubmitting
					? $translationStore.business.requestLocationSubmitting
					: $translationStore.business.requestLocationSubmit}
			</Button>
		</div>
	{/snippet}
</Modal>
