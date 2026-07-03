<script lang="ts">
	import { Select } from 'flowbite-svelte';
	import { MapPinAltOutline } from 'flowbite-svelte-icons';
	import { translationStore } from '$lib/i18n';
	import { categoryLabel } from '$lib/offers/categoryLabel';
	import type { CategoryFacet, FacetValue, OfferPeriod, OfferSort } from '$lib/types/offer';

	interface Props {
		cities: FacetValue[];
		categories: CategoryFacet[];
		selectedCity?: string;
		selectedCategory?: string;
		// Channel filter: '' (all) | 'online' | 'local', mapped to ?online by the page.
		selectedChannel?: string;
		// "Near me": "lat,lng" once a position is granted, '' otherwise.
		selectedNear?: string;
		selectedSort?: OfferSort;
		selectedPeriod?: OfferPeriod;
		hideExpired?: boolean;
		class?: string;
	}

	let {
		cities,
		categories,
		selectedCity = $bindable(''),
		selectedCategory = $bindable(''),
		selectedChannel = $bindable(''),
		selectedNear = $bindable(''),
		selectedSort = $bindable<OfferSort>('date'),
		selectedPeriod = $bindable<OfferPeriod>('all'),
		hideExpired = $bindable(false),
		class: className = ''
	}: Props = $props();

	const selectClass = 'w-44! rounded-full border-orange-100 bg-white';

	let sortOptions = $derived<{ value: OfferSort; label: string }[]>([
		{ value: 'date', label: $translationStore.deals.sortRecent },
		{ value: 'score', label: $translationStore.deals.sortPopular },
		{ value: 'ending', label: $translationStore.deals.sortEnding }
	]);

	const facetLabel = (f: FacetValue) => `${f.value} (${f.count})`;

	let locating = $state(false);

	// Toggle geolocation: ask for a position the first time, clear it on a second
	// click. The page picks up `selectedNear` and adds ?near/&radiusKm.
	function toggleNearMe() {
		if (selectedNear) {
			selectedNear = '';
			return;
		}
		if (typeof navigator === 'undefined' || !navigator.geolocation) return;
		locating = true;
		navigator.geolocation.getCurrentPosition(
			(position) => {
				selectedNear = `${position.coords.latitude},${position.coords.longitude}`;
				locating = false;
			},
			() => {
				locating = false;
			}
		);
	}
</script>

<div class="flex flex-wrap items-center gap-2.5 {className}">
	<Select
		bind:value={selectedCity}
		placeholder=""
		class={selectClass}
		aria-label={$translationStore.deals.filterCity}
	>
		<option value="">{$translationStore.deals.allCities}</option>
		{#each cities as city (city.value)}
			<option value={city.value}>{facetLabel(city)}</option>
		{/each}
	</Select>

	<Select
		bind:value={selectedCategory}
		placeholder=""
		class={selectClass}
		aria-label={$translationStore.deals.filterCategory}
	>
		<option value="">{$translationStore.deals.allCategories}</option>
		{#each categories as category (category.slug)}
			<option value={category.slug}>
				{categoryLabel($translationStore, category.slug, category.name)} ({category.count})
			</option>
		{/each}
	</Select>

	<Select
		bind:value={selectedChannel}
		placeholder=""
		class={selectClass}
		aria-label={$translationStore.deals.filterType}
	>
		<option value="">{$translationStore.deals.allTypes}</option>
		<option value="online">{$translationStore.deals.typeOnline}</option>
		<option value="local">{$translationStore.deals.typeLocal}</option>
	</Select>

	<button
		type="button"
		onclick={toggleNearMe}
		disabled={locating}
		aria-pressed={Boolean(selectedNear)}
		class="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors disabled:opacity-60 {selectedNear
			? 'border-primary-700 bg-primary-700 text-white shadow-sm'
			: 'border-orange-100 bg-white text-gray-600 hover:text-primary-600'}"
	>
		<MapPinAltOutline class="h-4 w-4" />
		{$translationStore.deals.nearMe}
	</button>

	<div class="inline-flex rounded-full border border-orange-100 bg-white p-1">
		{#each sortOptions as opt (opt.value)}
			<button
				type="button"
				onclick={() => (selectedSort = opt.value)}
				aria-pressed={selectedSort === opt.value}
				class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors {selectedSort ===
				opt.value
					? 'bg-primary-700 text-white shadow-sm'
					: 'text-gray-600 hover:text-primary-600'}"
			>
				{opt.label}
			</button>
		{/each}
	</div>

	{#if selectedSort === 'score'}
		<Select
			bind:value={selectedPeriod}
			placeholder=""
			class="w-36! rounded-full border-orange-100 bg-white"
		>
			<option value="all">{$translationStore.deals.periodAll}</option>
			<option value="day">{$translationStore.deals.periodDay}</option>
			<option value="week">{$translationStore.deals.periodWeek}</option>
			<option value="month">{$translationStore.deals.periodMonth}</option>
			<option value="year">{$translationStore.deals.periodYear}</option>
		</Select>
	{/if}

	<button
		type="button"
		onclick={() => (hideExpired = !hideExpired)}
		aria-pressed={hideExpired}
		class="rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors {hideExpired
			? 'border-primary-700 bg-primary-700 text-white shadow-sm'
			: 'border-orange-100 bg-white text-gray-600 hover:text-primary-600'}"
	>
		{$translationStore.deals.hideExpired}
	</button>
</div>
