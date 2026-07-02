<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { Button, Label, Modal, Spinner } from 'flowbite-svelte';
	import {
		BadgeCheckSolid,
		CheckCircleOutline,
		MapPinOutline,
		PlusOutline
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
				getMyOffers({ limit: 6, includeExpired: true })
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
</svelte:head>

<div class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-1 py-6 sm:py-10">
	<header class="space-y-1">
		<p class="text-sm font-semibold tracking-[0.2em] text-primary-600 uppercase">
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
				class="rounded-2xl border border-savings-100 bg-savings-50 px-4 py-3 text-sm text-savings-700"
			>
				{$translationStore.business.requestLocationSuccess}
			</p>
		{/if}

		<!-- Stats -->
		{#if stats}
			<section class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
				<div class="rounded-xl bg-orange-50 px-3 py-3 text-center ring-1 ring-orange-100">
					<span class="block text-2xl font-bold text-primary-600 tabular-nums"
						>{stats.offers.active}</span
					>
					<span class="text-sm text-gray-500">
						{$translationStore.business.statActiveOffers.replace(
							'{total}',
							String(stats.offers.total)
						)}
					</span>
				</div>
				<div class="rounded-xl bg-gray-50 px-3 py-3 text-center">
					<span class="block text-2xl font-bold text-gray-900 tabular-nums">{stats.views}</span>
					<span class="text-sm text-gray-500">{$translationStore.business.statViews}</span>
				</div>
				<div class="rounded-xl bg-gray-50 px-3 py-3 text-center">
					<span class="block text-2xl font-bold text-gray-900 tabular-nums">{stats.clicks}</span>
					<span class="text-sm text-gray-500">{$translationStore.business.statClicks}</span>
				</div>
				<div class="rounded-xl bg-gray-50 px-3 py-3 text-center">
					<span class="block text-2xl font-bold text-gray-900 tabular-nums">{stats.score}</span>
					<span class="text-sm text-gray-500">{$translationStore.business.statScore}</span>
				</div>
				<div class="rounded-xl bg-gray-50 px-3 py-3 text-center">
					<span class="block text-2xl font-bold text-gray-900 tabular-nums">{stats.comments}</span>
					<span class="text-sm text-gray-500">{$translationStore.business.statComments}</span>
				</div>
				<div class="rounded-xl bg-gray-50 px-3 py-3 text-center">
					<span class="block text-2xl font-bold text-gray-900 tabular-nums">{stats.reports}</span>
					<span class="text-sm text-gray-500">{$translationStore.business.statReports}</span>
				</div>
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
			<h2 class="font-bold text-gray-900">{$translationStore.business.myOffers}</h2>
			{#if myOffers.length === 0}
				<p
					class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-500"
				>
					{$translationStore.business.myOffersEmpty}
				</p>
			{:else}
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each myOffers as offer (offer.id)}
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
