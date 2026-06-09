<script lang="ts">
	import { Select } from 'flowbite-svelte';
	import { translationStore } from '$lib/i18n';
	import type { OfferPeriod, OfferSort } from '$lib/types/offer';

	interface Props {
		cities: string[];
		offerTypes: string[];
		selectedCity?: string;
		selectedOfferType?: string;
		selectedSort?: OfferSort;
		selectedPeriod?: OfferPeriod;
		class?: string;
	}

	let {
		cities,
		offerTypes,
		selectedCity = $bindable(''),
		selectedOfferType = $bindable(''),
		selectedSort = $bindable<OfferSort>('date'),
		selectedPeriod = $bindable<OfferPeriod>('all'),
		class: className = ''
	}: Props = $props();

	const selectClass = 'w-44! rounded-full border-orange-100 bg-white';

	function typeLabel(type: string): string {
		if (type === 'online') return $translationStore.deals.typeOnline;
		if (type === 'local') return $translationStore.deals.typeLocal;
		return type;
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
		{#each cities as city (city)}
			<option value={city}>{city}</option>
		{/each}
	</Select>

	<Select
		bind:value={selectedOfferType}
		placeholder=""
		class={selectClass}
		aria-label={$translationStore.deals.filterType}
	>
		<option value="">{$translationStore.deals.allTypes}</option>
		{#each offerTypes as type (type)}
			<option value={type}>{typeLabel(type)}</option>
		{/each}
	</Select>

	<div class="inline-flex rounded-full border border-orange-100 bg-white p-1">
		<button
			type="button"
			onclick={() => (selectedSort = 'date')}
			class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors {selectedSort ===
			'date'
				? 'bg-primary-500 text-white shadow-sm'
				: 'text-gray-600 hover:text-primary-600'}"
		>
			{$translationStore.deals.sortRecent}
		</button>
		<button
			type="button"
			onclick={() => (selectedSort = 'score')}
			class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors {selectedSort ===
			'score'
				? 'bg-primary-500 text-white shadow-sm'
				: 'text-gray-600 hover:text-primary-600'}"
		>
			{$translationStore.deals.sortPopular}
		</button>
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
</div>
