<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import { Card } from 'flowbite-svelte';
	import {
		BadgeCheckSolid,
		CalendarMonthOutline,
		CheckCircleOutline,
		GlobeOutline,
		MapPinOutline,
		MessagesOutline,
		StoreOutline
	} from 'flowbite-svelte-icons';
	import { localeStore, translationStore } from '$lib/i18n';
	import { categoryLabel } from '$lib/offers/categoryLabel';
	import { isOfferExpired } from '$lib/offers/expiration';
	import type { Offer } from '$lib/types/offer';
	import DealStatusBadge from './DealStatusBadge.svelte';
	import VotePanel from './VotePanel.svelte';

	const MAX_CATEGORY_CHIPS = 3;

	interface Props {
		offer: Offer;
		class?: string;
		actions?: Snippet;
	}

	let { offer, class: className = '', actions }: Props = $props();

	let detailHref = $derived(resolve('/deals/[id]', { id: offer.id }));

	let expired = $derived(isOfferExpired(offer));
	let isDimmed = $derived(expired || offer.status === 'DISABLED' || offer.status === 'DELETED');
	let isOnline = $derived(offer.isOnline);
	let isLocal = $derived(!offer.isOnline);

	let expirationLabel = $derived(
		new Intl.DateTimeFormat($localeStore, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(offer.endDate))
	);

	let visibleCategories = $derived(offer.categories.slice(0, MAX_CATEGORY_CHIPS));
	let extraCategories = $derived(offer.categories.length - visibleCategories.length);
</script>

<Card
	class="flex max-w-full! flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white p-0! transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lg hover:shadow-orange-900/5 {isDimmed
		? 'opacity-75 grayscale-[0.5]'
		: ''} {className}"
>
	<div class="flex grow flex-col p-4">
		<div class="mb-3 flex items-start justify-between gap-4">
			<VotePanel
				offerId={offer.id}
				initialScore={offer.score}
				initialUserVote={offer.userVote}
				disabled={expired}
				size="md"
			/>
			<div class="flex flex-col items-end gap-2">
				<div class="flex items-center gap-2">
					<DealStatusBadge status={offer.status} />
					{#if actions}
						{@render actions()}
					{/if}
				</div>
				{#if offer.official}
					<span
						class="inline-flex items-center gap-1 rounded-full bg-savings-600 px-2.5 py-1 text-xs font-semibold text-white"
					>
						<BadgeCheckSolid class="h-3 w-3" />
						{$translationStore.deals.official}
					</span>
				{/if}
				{#if isOnline}
					<span
						class="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700"
					>
						<GlobeOutline class="h-3 w-3" />
						{$translationStore.deals.typeOnline}
					</span>
				{:else if isLocal}
					<span
						class="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700"
					>
						<MapPinOutline class="h-3 w-3" />
						{$translationStore.deals.typeLocal}
					</span>
				{/if}
			</div>
		</div>

		<a href={detailHref} class="group grow">
			<h3
				class="mb-2 line-clamp-2 font-display text-lg leading-tight font-extrabold text-gray-900 transition-colors group-hover:text-primary-600"
			>
				{offer.title}
			</h3>
			<p class="mb-4 line-clamp-2 text-sm text-gray-600">
				{offer.description}
			</p>
		</a>

		{#if visibleCategories.length > 0}
			<div class="mb-4 flex flex-wrap gap-1.5">
				{#each visibleCategories as category (category.id)}
					<span
						class="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-primary-700"
					>
						{categoryLabel($translationStore, category.slug, category.name)}
					</span>
				{/each}
				{#if extraCategories > 0}
					<span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
						+{extraCategories}
					</span>
				{/if}
			</div>
		{/if}

		<div
			class="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-orange-100 pt-4 text-xs text-gray-500"
		>
			<div class="flex items-center gap-1 font-medium text-gray-700">
				<StoreOutline class="h-3.5 w-3.5 text-gray-400" />
				{offer.merchant.name}
				{#if offer.merchant.verified}
					<CheckCircleOutline class="h-3.5 w-3.5 text-savings-600" />
				{/if}
			</div>
			{#if isLocal && offer.location}
				<div class="flex items-center gap-1">
					<MapPinOutline class="h-3.5 w-3.5 text-gray-400" />
					{offer.location.city}
				</div>
			{/if}
			<div class="flex items-center gap-1">
				<MessagesOutline class="h-3.5 w-3.5 text-gray-400" />
				{offer.commentCount}
			</div>
			<div class="ml-auto flex items-center gap-1">
				<CalendarMonthOutline class="h-3.5 w-3.5 text-gray-400" />
				{$translationStore.deals.expiresOn}
				{expirationLabel}
			</div>
		</div>
	</div>
</Card>
