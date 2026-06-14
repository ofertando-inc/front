<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Avatar, Button, Card, Modal } from 'flowbite-svelte';
	import {
		CalendarMonthOutline,
		ArrowUpRightFromSquareOutline,
		CheckCircleOutline,
		CheckOutline,
		FlagOutline,
		FlagSolid,
		MapPinOutline,
		ShareNodesOutline,
		StoreOutline,
		TrashBinOutline
	} from 'flowbite-svelte-icons';
	import { ApiError } from '$lib/api/client';
	import { getOfferById, listOffers } from '$lib/api/offers';
	import { getMyReport } from '$lib/api/reports';
	import CommentThread from '$lib/components/comments/CommentThread.svelte';
	import DealStatusBadge from '$lib/components/offers/DealStatusBadge.svelte';
	import LocationMap from '$lib/components/offers/LocationMap.svelte';
	import ReportModal from '$lib/components/offers/ReportModal.svelte';
	import VotePanel from '$lib/components/offers/VotePanel.svelte';
	import { ErrorKey } from '$lib/errors/errorKeys';
	import { isOfferExpired } from '$lib/offers/expiration';
	import { resolveOfferError } from '$lib/offers/offerErrors';
	import { authStore } from '$lib/stores/auth';
	import { localeStore, translationStore } from '$lib/i18n';
	import type { Offer } from '$lib/types/offer';
	import type { ReportReason } from '$lib/types/report';
	import type { SubmitFunction } from '@sveltejs/kit';

	let offer = $state<Offer | null>(null);
	let related = $state<Offer[]>([]);
	let loading = $state(true);
	let notFound = $state(false);
	let bannerError = $state<string | null>(null);
	let deleteModalOpen = $state(false);
	let deleting = $state(false);
	let deleteErrorKey = $state<string | null>(null);
	let reportModalOpen = $state(false);
	let alreadyReported = $state(false);
	let shareCopied = $state(false);

	let canEdit = $derived(Boolean(offer && $authStore.user?.id === offer.createdById));
	let expired = $derived(offer ? isOfferExpired(offer) : false);
	let visibleBannerError = $derived(
		deleteErrorKey ? resolveDeleteError(deleteErrorKey) : bannerError
	);

	let statusBanner = $derived.by(() => {
		if (!offer) return null;
		if (expired) return $translationStore.deal.expiredBanner;
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

	async function handleShare() {
		const url = page.url.href;
		const title = offer?.title ?? $translationStore.common.appName;

		// Native share sheet where available (mostly mobile); otherwise copy the
		// link to the clipboard and flash a confirmation on the button.
		if (typeof navigator !== 'undefined' && navigator.share) {
			try {
				await navigator.share({ title, url });
			} catch {
				// The user dismissed the share sheet — nothing to do.
			}
			return;
		}

		try {
			await navigator.clipboard.writeText(url);
			shareCopied = true;
			setTimeout(() => (shareCopied = false), 2000);
		} catch {
			// Clipboard unavailable (insecure context / denied) — ignore.
		}
	}

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
			const [fetchedOffer, fetchedReport] = await Promise.all([
				getOfferById(id),
				loadInitialUserReport(id)
			]);
			alreadyReported = fetchedReport !== null;
			offer = fetchedOffer;
			void loadRelated(fetchedOffer);
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

	async function loadInitialUserReport(id: string): Promise<ReportReason | null> {
		if (!$authStore.isAuthenticated) return null;
		try {
			const res = await getMyReport(id);
			return res.reason;
		} catch {
			return null;
		}
	}

	async function loadRelated(current: Offer) {
		try {
			const res = await listOffers({ city: current.location?.city ?? undefined, limit: 4 });
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
				<Card class="max-w-full! p-6! sm:p-8!">
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
				<Card class="max-w-full! p-6!">
					<div class="animate-pulse space-y-3">
						<div class="h-5 w-1/2 rounded bg-gray-200"></div>
						<div class="h-3 w-full rounded bg-gray-200"></div>
						<div class="h-3 w-5/6 rounded bg-gray-200"></div>
					</div>
				</Card>
			</div>
		</div>
	{:else if notFound}
		<Card class="mx-auto max-w-md p-8! text-center">
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
		<Card class="mx-auto max-w-md p-8! text-center">
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

				<Card class="max-w-full! p-6! sm:p-8!">
					<div class="mb-4 flex flex-wrap items-center gap-3">
						<DealStatusBadge status={offer.status} />
						<span class="flex items-center gap-1 text-sm text-gray-500">
							<StoreOutline class="h-4 w-4" />
							{offer.merchant.name}
							{#if offer.merchant.verified}
								<CheckCircleOutline class="h-4 w-4 text-savings-600" />
							{/if}
						</span>
						{#if !offer.isOnline && offer.location}
							<span class="flex items-center gap-1 text-sm text-gray-500">
								<MapPinOutline class="h-4 w-4" />
								{offer.location.address}, {offer.location.city}
								{#if offer.location.verified}
									<CheckCircleOutline class="h-4 w-4 text-savings-600" />
								{/if}
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
						<VotePanel
							offerId={offer.id}
							initialScore={offer.score}
							initialUserVote={offer.userVote}
							disabled={expired}
							size="lg"
						/>
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
								{offer.createdByUsername.slice(0, 1).toUpperCase()}
							</Avatar>
							<div>
								<p class="text-sm font-medium text-gray-900">
									{$translationStore.deal.publishedBy}
									{offer.createdByUsername}
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
								onclick={handleShare}
								aria-label={shareCopied
									? $translationStore.deal.shareCopied
									: $translationStore.deal.share}
								title={shareCopied
									? $translationStore.deal.shareCopied
									: $translationStore.deal.share}
								class="rounded-full p-2 transition-colors {shareCopied
									? 'text-green-600'
									: 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}"
							>
								{#if shareCopied}
									<CheckOutline class="h-5 w-5" />
								{:else}
									<ShareNodesOutline class="h-5 w-5" />
								{/if}
							</button>
							{#if $authStore.isAuthenticated}
								{#if alreadyReported}
									<button
										type="button"
										aria-label={$translationStore.report.alreadyReported}
										title={$translationStore.report.alreadyReported}
										disabled
										class="rounded-full p-2 text-red-500 disabled:cursor-not-allowed"
									>
										<FlagSolid class="h-5 w-5" />
									</button>
								{:else if expired}
									<button
										type="button"
										aria-label={$translationStore.report.expiredHint}
										title={$translationStore.report.expiredHint}
										disabled
										class="rounded-full p-2 text-gray-300 disabled:cursor-not-allowed"
									>
										<FlagOutline class="h-5 w-5" />
									</button>
								{:else}
									<button
										type="button"
										aria-label={$translationStore.deal.report}
										onclick={() => (reportModalOpen = true)}
										class="rounded-full p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
									>
										<FlagOutline class="h-5 w-5" />
									</button>
								{/if}
							{/if}
						</div>
					</div>
				</Card>

				<Card class="max-w-full! p-6! sm:p-8!">
					<h2 class="mb-6 text-xl font-bold text-gray-900">
						{$translationStore.comments.title} ({offer.commentCount})
					</h2>

					<CommentThread
						offerId={offer.id}
						onCountChange={(delta) => {
							if (offer) offer.commentCount += delta;
						}}
					/>
				</Card>
			</div>

			<aside class="space-y-6">
				{#if !offer.isOnline && offer.location && offer.location.latitude != null && offer.location.longitude != null}
					<Card class="max-w-full! p-6!">
						<h3 class="mb-4 font-bold text-gray-900">{$translationStore.deal.locationTitle}</h3>
						{#if offer.location.address}
							<p class="mb-3 text-sm text-gray-600">
								{offer.location.address}, {offer.location.city}
							</p>
						{/if}
						<LocationMap latitude={offer.location.latitude} longitude={offer.location.longitude} />
					</Card>
				{/if}

				<Card class="max-w-full! p-6!">
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
										<span>{item.merchant.name}</span>
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

{#if offer && $authStore.isAuthenticated}
	<ReportModal
		offerId={offer.id}
		bind:open={reportModalOpen}
		onSuccess={(status) => {
			if (offer) offer.status = status;
			alreadyReported = true;
		}}
	/>
{/if}
