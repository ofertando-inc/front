<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import { Card } from 'flowbite-svelte';
	import {
		CalendarMonthOutline,
		GlobeOutline,
		MapPinOutline,
		StoreOutline
	} from 'flowbite-svelte-icons';
	import { localeStore, translationStore } from '$lib/i18n';
	import type { Offer } from '$lib/types/offer';
	import DealStatusBadge from './DealStatusBadge.svelte';
	import VotePanel from './VotePanel.svelte';

	interface Props {
		offer: Offer;
		class?: string;
		actions?: Snippet;
	}

	let { offer, class: className = '', actions }: Props = $props();

	let detailHref = $derived(resolve('/deals/[id]', { id: offer.id }));

	let isDimmed = $derived(
		offer.status === 'EXPIRED' || offer.status === 'DISABLED' || offer.status === 'DELETED'
	);
	let isOnline = $derived(offer.offerType === 'online');
	let isLocal = $derived(offer.offerType === 'local');

	let expirationLabel = $derived(
		new Intl.DateTimeFormat($localeStore, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(offer.endDate))
	);
</script>

<Card
	class="flex max-w-full! flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-0! transition-shadow hover:shadow-lg {isDimmed
		? 'opacity-75 grayscale-[0.5]'
		: ''} {className}"
>
	<div class="flex grow flex-col p-4">
		<div class="mb-3 flex items-start justify-between gap-4">
			<VotePanel initialScore={offer.score} size="md" />
			<div class="flex flex-col items-end gap-2">
				<div class="flex items-center gap-2">
					<DealStatusBadge status={offer.status} />
					{#if actions}
						{@render actions()}
					{/if}
				</div>
				{#if isOnline}
					<span
						class="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
					>
						<GlobeOutline class="h-3 w-3" />
						{$translationStore.deals.typeOnline}
					</span>
				{:else if isLocal}
					<span
						class="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700"
					>
						<MapPinOutline class="h-3 w-3" />
						{$translationStore.deals.typeLocal}
					</span>
				{/if}
			</div>
		</div>

		<a href={detailHref} class="group grow">
			<h3
				class="mb-2 line-clamp-2 text-lg leading-tight font-bold text-gray-900 transition-colors group-hover:text-primary-600"
			>
				{offer.title}
			</h3>
			<p class="mb-4 line-clamp-2 text-sm text-gray-600">
				{offer.description}
			</p>
		</a>

		<div
			class="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500"
		>
			<div class="flex items-center gap-1 font-medium text-gray-700">
				<StoreOutline class="h-3.5 w-3.5 text-gray-400" />
				{offer.storeName}
			</div>
			{#if isLocal}
				<div class="flex items-center gap-1">
					<MapPinOutline class="h-3.5 w-3.5 text-gray-400" />
					{offer.city}
				</div>
			{/if}
			<div class="ml-auto flex items-center gap-1">
				<CalendarMonthOutline class="h-3.5 w-3.5 text-gray-400" />
				{$translationStore.deals.expiresOn}
				{expirationLabel}
			</div>
		</div>
	</div>
</Card>
