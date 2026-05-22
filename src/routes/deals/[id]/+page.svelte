<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Avatar, Button, Card, Modal, Textarea } from 'flowbite-svelte';
	import {
		CalendarMonthOutline,
		ArrowUpRightFromSquareOutline,
		FlagOutline,
		MapPinOutline,
		ShareNodesOutline,
		StoreOutline,
		TrashBinOutline
	} from 'flowbite-svelte-icons';
	import { ApiError } from '$lib/api/client';
	import { getOfferById, listOffers } from '$lib/api/offers';
	import DealStatusBadge from '$lib/components/offers/DealStatusBadge.svelte';
	import VotePanel from '$lib/components/offers/VotePanel.svelte';
	import { ErrorKey } from '$lib/errors/errorKeys';
	import { resolveOfferError } from '$lib/offers/offerErrors';
	import { authStore } from '$lib/stores/auth';
	import { localeStore, translationStore } from '$lib/i18n';
	import type { Offer } from '$lib/types/offer';
	import type { SubmitFunction } from '@sveltejs/kit';

	let offer = $state<Offer | null>(null);
	let related = $state<Offer[]>([]);
	let loading = $state(true);
	let notFound = $state(false);
	let bannerError = $state<string | null>(null);
	let deleteModalOpen = $state(false);
	let deleting = $state(false);
	let deleteErrorKey = $state<string | null>(null);

	let canEdit = $derived(Boolean(offer && $authStore.user?.id === offer.createdById));
	let visibleBannerError = $derived(
		deleteErrorKey ? resolveDeleteError(deleteErrorKey) : bannerError
	);

	let statusBanner = $derived.by(() => {
		if (!offer) return null;
		if (offer.status === 'EXPIRED') return $translationStore.deal.expiredBanner;
		if (offer.status === 'DISABLED') return $translationStore.deal.disabledBanner;
		if (offer.status === 'REPORTED') return $translationStore.deal.reportedBanner;
		return null;
	});

	let expirationLabel = $derived(
		offer
			? new Intl.DateTimeFormat($localeStore, {
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				}).format(new Date(offer.endDate))
			: ''
	);

	let publishedLabel = $derived(
		offer
			? new Intl.DateTimeFormat($localeStore, {
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				}).format(new Date(offer.createdAt))
			: ''
	);

	const MOCK_COMMENTS = $derived([
		{ author: 'María', text: $translationStore.deal.mockComment1, hoursAgo: 2 },
		{ author: 'Carlos', text: $translationStore.deal.mockComment2, hoursAgo: 5 },
		{ author: 'Ana', text: $translationStore.deal.mockComment3, hoursAgo: 12 }
	]);

	function ageLabel(hours: number): string {
		return $translationStore.deal.mockCommentAge.replace('{hours}', String(hours));
	}

	function resolveDeleteError(errorKey: string): string {
		if (errorKey === 'deleteDeal.genericError') {
			return $translationStore.deleteDeal.genericError;
		}

		return (
			$translationStore.errors[errorKey as keyof typeof $translationStore.errors] ??
			$translationStore.deleteDeal.genericError
		);
	}

	const handleDelete: SubmitFunction = () => {
		deleting = true;
		deleteErrorKey = null;
		bannerError = null;

		return async ({ result, update }) => {
			deleting = false;

			if (result.type === 'failure') {
				deleteModalOpen = false;
				const data = result.data as { deleteError?: unknown } | undefined;
				deleteErrorKey =
					typeof data?.deleteError === 'string' ? data.deleteError : 'deleteDeal.genericError';
				return;
			}

			await update({ reset: false });
		};
	};

	onMount(async () => {
		await loadOffer(page.params.id);
	});

	async function loadOffer(id: string | undefined) {
		if (!id) {
			notFound = true;
			loading = false;
			return;
		}

		loading = true;
		bannerError = null;
		deleteErrorKey = null;
		notFound = false;

		try {
			offer = await getOfferById(id);
			void loadRelated(offer);
		} catch (err) {
			if (err instanceof ApiError && err.key === ErrorKey.OfferNotFound) {
				notFound = true;
			} else {
				const resolved = resolveOfferError(err, $translationStore, 'browse');
				bannerError = resolved.bannerMessage;
			}
		} finally {
			loading = false;
		}
	}

	async function loadRelated(current: Offer) {
		try {
			const res = await listOffers({ city: current.city, limit: 4 });
			related = res.items.filter((item) => item.id !== current.id).slice(0, 3);
		} catch {
			related = [];
		}
	}
</script>

<svelte:head>
	<title
		>{offer?.title ?? $translationStore.errorPage.notFoundTitle} — {$translationStore.common
			.appName}</title
	>
</svelte:head>

<section class="mx-auto max-w-7xl py-4 sm:py-8">
	{#if loading}
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
			<div class="space-y-6 lg:col-span-2">
				<Card class="!max-w-full !p-6 sm:!p-8">
					<div class="animate-pulse space-y-4">
						<div class="h-5 w-32 rounded bg-gray-200"></div>
						<div class="h-8 w-3/4 rounded bg-gray-200"></div>
						<div class="h-32 rounded-xl bg-gray-200"></div>
						<div class="h-4 w-full rounded bg-gray-200"></div>
						<div class="h-4 w-5/6 rounded bg-gray-200"></div>
					</div>
				</Card>
			</div>
			<div class="space-y-6">
				<Card class="!max-w-full !p-6">
					<div class="animate-pulse space-y-3">
						<div class="h-5 w-1/2 rounded bg-gray-200"></div>
						<div class="h-3 w-full rounded bg-gray-200"></div>
						<div class="h-3 w-5/6 rounded bg-gray-200"></div>
					</div>
				</Card>
			</div>
		</div>
	{:else if notFound}
		<Card class="mx-auto max-w-md !p-8 text-center">
			<p class="text-6xl font-extrabold text-primary-500">404</p>
			<h1 class="mt-4 text-2xl font-bold text-gray-900">
				{$translationStore.errors['offer.not_found']}
			</h1>
			<div class="mt-6 flex justify-center">
				<Button href={resolve('/deals')} class="rounded-xl">
					{$translationStore.errorPage.backToHome}
				</Button>
			</div>
		</Card>
	{:else if bannerError && !offer}
		<Card class="mx-auto max-w-md !p-8 text-center">
			<h1 class="text-2xl font-bold text-gray-900">
				{$translationStore.errorPage.genericTitle}
			</h1>
			<p class="mt-3 text-sm text-gray-600">{bannerError}</p>
			<div class="mt-6 flex justify-center">
				<Button href={resolve('/deals')} class="rounded-xl">
					{$translationStore.errorPage.backToHome}
				</Button>
			</div>
		</Card>
	{:else if offer}
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
			<div class="space-y-6 lg:col-span-2">
				{#if statusBanner}
					<p
						role="status"
						class="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800"
					>
						{statusBanner}
					</p>
				{/if}

				{#if visibleBannerError}
					<p
						role="alert"
						class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
					>
						{visibleBannerError}
					</p>
				{/if}

				<Card class="!max-w-full !p-6 sm:!p-8">
					<div class="mb-4 flex flex-wrap items-center gap-3">
						<DealStatusBadge status={offer.status} />
						<span class="flex items-center gap-1 text-sm text-gray-500">
							<StoreOutline class="h-4 w-4" />
							{offer.storeName}
						</span>
						{#if offer.offerType === 'local'}
							<span class="flex items-center gap-1 text-sm text-gray-500">
								<MapPinOutline class="h-4 w-4" />
								{offer.city}
							</span>
						{/if}
						<span class="ml-auto flex items-center gap-1 text-sm text-gray-500">
							<CalendarMonthOutline class="h-4 w-4" />
							{$translationStore.deals.expiresOn}
							{expirationLabel}
						</span>
					</div>

					<h1 class="mb-6 text-2xl leading-tight font-bold text-gray-900 md:text-3xl">
						{offer.title}
					</h1>

					<div
						class="mb-8 flex flex-col items-stretch justify-between gap-6 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center"
					>
						<VotePanel initialScore={offer.score} size="lg" />
						{#if offer.externalUrl}
							<Button
								href={offer.externalUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="rounded-xl px-8 py-3 font-bold"
							>
								<span class="flex items-center gap-2">
									{$translationStore.deal.goToStore}
									<ArrowUpRightFromSquareOutline class="h-5 w-5" />
								</span>
							</Button>
						{/if}
					</div>

					<p class="text-lg leading-relaxed whitespace-pre-line text-gray-700">
						{offer.description}
					</p>

					<div
						class="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-6"
					>
						<div class="flex items-center gap-3">
							<Avatar cornerStyle="circular" class="bg-primary-100 text-primary-600">
								{offer.createdById.slice(0, 1).toUpperCase()}
							</Avatar>
							<div>
								<p class="text-sm font-medium text-gray-900">
									{$translationStore.deal.publishedBy}
									{offer.createdById}
								</p>
								<p class="text-xs text-gray-500">{publishedLabel}</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							{#if canEdit}
								<Button
									href={resolve('/deals/[id]/edit', { id: offer.id })}
									color="alternative"
									size="sm"
									class="rounded-full"
								>
									{$translationStore.deal.edit}
								</Button>
								<Button
									color="red"
									outline
									size="sm"
									class="rounded-full"
									onclick={() => (deleteModalOpen = true)}
								>
									<span class="flex items-center gap-1.5">
										<TrashBinOutline class="h-4 w-4" />
										{$translationStore.deleteDeal.openButton}
									</span>
								</Button>
							{/if}
							<button
								type="button"
								aria-label={$translationStore.deal.share}
								class="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
							>
								<ShareNodesOutline class="h-5 w-5" />
							</button>
							<button
								type="button"
								aria-label={$translationStore.deal.report}
								title={$translationStore.deal.commentDisabledHint}
								class="rounded-full p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
							>
								<FlagOutline class="h-5 w-5" />
							</button>
						</div>
					</div>
				</Card>

				<Card class="!max-w-full !p-6 sm:!p-8">
					<h2 class="mb-6 text-xl font-bold text-gray-900">
						{$translationStore.deal.commentsTitle} ({MOCK_COMMENTS.length})
					</h2>

					<div class="mb-8 flex gap-4">
						<Avatar cornerStyle="circular" class="bg-gray-200 text-gray-500" />
						<div class="flex-grow space-y-2">
							<Textarea rows={3} placeholder={$translationStore.deal.commentPlaceholder} disabled />
							<div class="flex items-center justify-between">
								<span class="text-xs text-gray-500"
									>{$translationStore.deal.commentDisabledHint}</span
								>
								<Button disabled class="rounded-lg">
									{$translationStore.deal.commentSubmit}
								</Button>
							</div>
						</div>
					</div>

					<div class="space-y-6">
						{#each MOCK_COMMENTS as comment, i (i)}
							<div class="flex gap-4">
								<Avatar cornerStyle="circular" class="bg-blue-100 text-blue-600">
									{comment.author.slice(0, 1)}
								</Avatar>
								<div>
									<div class="mb-1 flex items-baseline gap-2">
										<span class="font-bold text-gray-900">{comment.author}</span>
										<span class="text-xs text-gray-500">{ageLabel(comment.hoursAgo)}</span>
									</div>
									<p class="text-gray-700">{comment.text}</p>
								</div>
							</div>
						{/each}
					</div>
				</Card>
			</div>

			<aside class="space-y-6">
				<Card class="!max-w-full !p-6">
					<h3 class="mb-4 font-bold text-gray-900">{$translationStore.deal.relatedTitle}</h3>
					{#if related.length === 0}
						<p class="text-sm text-gray-500">{$translationStore.deal.relatedEmpty}</p>
					{:else}
						<div class="space-y-4">
							{#each related as item (item.id)}
								<a
									href={resolve('/deals/[id]', { id: item.id })}
									class="group block border-b border-gray-100 pb-3 last:border-0 last:pb-0"
								>
									<h4
										class="line-clamp-2 text-sm font-bold text-gray-900 transition-colors group-hover:text-primary-600"
									>
										{item.title}
									</h4>
									<div class="mt-1 flex items-center gap-2 text-xs text-gray-500">
										<span class="font-bold text-primary-600">{item.score}°</span>
										<span>•</span>
										<span>{item.storeName}</span>
									</div>
								</a>
							{/each}
						</div>
					{/if}
				</Card>
			</aside>
		</div>
	{/if}
</section>

{#if offer && canEdit}
	<Modal bind:open={deleteModalOpen} title={$translationStore.deleteDeal.title} size="md">
		<div class="space-y-4">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
				<TrashBinOutline class="h-6 w-6" />
			</div>
			<p class="text-sm leading-6 text-slate-600">
				{$translationStore.deleteDeal.description}
			</p>
			<p class="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
				{offer.title}
			</p>
		</div>

		{#snippet footer()}
			<div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
				<Button
					color="alternative"
					class="w-full sm:w-auto"
					disabled={deleting}
					onclick={() => (deleteModalOpen = false)}
				>
					{$translationStore.deleteDeal.cancel}
				</Button>
				<form method="POST" action="?/delete" use:enhance={handleDelete} class="w-full sm:w-auto">
					<Button
						type="submit"
						color="red"
						class="w-full sm:w-auto"
						loading={deleting}
						disabled={deleting}
					>
						{deleting
							? $translationStore.deleteDeal.deleting
							: $translationStore.deleteDeal.confirm}
					</Button>
				</form>
			</div>
		{/snippet}
	</Modal>
{/if}
