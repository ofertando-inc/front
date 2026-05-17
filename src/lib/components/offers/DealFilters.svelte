<script lang="ts">
	import { Button, ButtonGroup, Select } from 'flowbite-svelte';
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
</script>

<div class="flex flex-wrap items-center gap-3 {className}">
	<Select
		bind:value={selectedCity}
		class="min-w-40"
		aria-label={$translationStore.deals.filterCity}
	>
		<option value="">{$translationStore.deals.allCities}</option>
		{#each cities as city (city)}
			<option value={city}>{city}</option>
		{/each}
	</Select>

	<Select
		bind:value={selectedOfferType}
		class="min-w-40"
		aria-label={$translationStore.deals.filterType}
	>
		<option value="">{$translationStore.deals.allTypes}</option>
		{#each offerTypes as type (type)}
			<option value={type}>{type}</option>
		{/each}
	</Select>

	<ButtonGroup>
		<Button
			color={selectedSort === 'date' ? 'primary' : 'alternative'}
			onclick={() => (selectedSort = 'date')}
		>
			{$translationStore.deals.sortRecent}
		</Button>
		<Button
			color={selectedSort === 'score' ? 'primary' : 'alternative'}
			onclick={() => (selectedSort = 'score')}
		>
			{$translationStore.deals.sortPopular}
		</Button>
	</ButtonGroup>

	{#if selectedSort === 'score'}
		<Select bind:value={selectedPeriod} class="min-w-32">
			<option value="all">{$translationStore.deals.periodAll}</option>
			<option value="day">{$translationStore.deals.periodDay}</option>
			<option value="week">{$translationStore.deals.periodWeek}</option>
			<option value="month">{$translationStore.deals.periodMonth}</option>
			<option value="year">{$translationStore.deals.periodYear}</option>
		</Select>
	{/if}
</div>
