<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import {
		Avatar,
		Button,
		Card,
		Dropdown,
		DropdownItem,
		Modal,
		TabItem,
		Tabs
	} from 'flowbite-svelte';
	import {
		DotsVerticalOutline,
		FireSolid,
		MessageDotsOutline,
		TagSolid,
		TrashBinOutline
	} from 'flowbite-svelte-icons';
	import { getMyStats } from '$lib/api/auth';
	import { ApiError } from '$lib/api/client';
	import { deleteOffer, getMyOffers } from '$lib/api/offers';
	import DealCard from '$lib/components/offers/DealCard.svelte';
	import DealCardSkeleton from '$lib/components/offers/DealCardSkeleton.svelte';
	import { ErrorKey } from '$lib/errors/errorKeys';
	import { authStore } from '$lib/stores/auth';
	import { localeStore, translationStore } from '$lib/i18n';
	import { resolveOfferError, type OfferContext } from '$lib/offers/offerErrors';
	import type { UserStats } from '$lib/types/auth';
	import type { Offer } from '$lib/types/offer';

	let loading = $state(true);
	let offersLoading = $state(false);
	let selectedTab = $state('offers');
	let myOffers = $state<Offer[]>([]);
	let stats = $state<UserStats | null>(null);
	let offersError = $state<{ error: unknown; context: OfferContext } | null>(null);
	let deleteModalOpen = $state(false);
	let deleteTarget = $state<Offer | null>(null);
	let deletingOfferId = $state<string | null>(null);

	const offerSkeletons = [0, 1, 2];

	let isDeletingTarget = $derived(Boolean(deleteTarget && deletingOfferId === deleteTarget.id));
	let offersErrorMessage = $derived(
		offersError
			? resolveOfferError(offersError.error, $translationStore, offersError.context).bannerMessage
			: null
	);

	let memberDate = $derived(
		$authStore.user
			? new Intl.DateTimeFormat($localeStore, {
					month: 'long',
					year: 'numeric'
				}).format(new Date($authStore.user.createdAt))
			: ''
	);

	async function redirectIfAuthError(error: unknown): Promise<boolean> {
		if (
			error instanceof ApiError &&
			(error.key === ErrorKey.AuthUnauthorized || error.key === ErrorKey.AuthForbidden)
		) {
			await goto(resolve('/login'));
			return true;
		}

		return false;
	}

	async function loadMyOffers() {
		offersLoading = true;
		offersError = null;

		try {
			const response = await getMyOffers({ limit: 20, sort: 'date' });
			myOffers = response.items;
		} catch (error) {
			if (await redirectIfAuthError(error)) return;
			offersError = { error, context: 'browse' };
		} finally {
			offersLoading = false;
		}
	}

	async function loadStats() {
		try {
			stats = await getMyStats();
		} catch {
			// Stats are non-critical: leave the counters as placeholders on failure.
			stats = null;
		}
	}

	function openDeleteModal(offer: Offer) {
		deleteTarget = offer;
		deleteModalOpen = true;
	}

	function closeDeleteModal() {
		if (deletingOfferId) return;
		deleteModalOpen = false;
		deleteTarget = null;
	}

	async function handleDeleteOffer() {
		if (!deleteTarget || deletingOfferId) return;

		const deletedId = deleteTarget.id;
		deletingOfferId = deletedId;
		offersError = null;

		try {
			await deleteOffer(deletedId);
			myOffers = myOffers.filter((offer) => offer.id !== deletedId);
			deleteModalOpen = false;
			deleteTarget = null;
		} catch (error) {
			if (await redirectIfAuthError(error)) return;
			offersError = { error, context: 'delete' };
			deleteModalOpen = false;
		} finally {
			deletingOfferId = null;
		}
	}

	onMount(async () => {
		if (!browser) return;

		// With cookie-based sessions we can't peek the auth state without a
		// round-trip. Try to load the current user — if the cookies are missing
		// or expired (and the refresh also fails), redirect to login.
		try {
			await authStore.loadCurrentUser();
			loading = false;
			void loadMyOffers();
			void loadStats();
		} catch {
			await goto(resolve('/login'));
			return;
		}
	});
</script>

<svelte:head>
	<title>{$translationStore.auth.profileTitle}</title>
</svelte:head>

{#if loading}
	<section
		class="mx-auto max-w-7xl space-y-8 py-4 sm:py-8"
		aria-busy="true"
		aria-label={$translationStore.common.loading}
	>
		<Card size="xl" class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
			<div class="flex animate-pulse flex-col items-center gap-6 md:flex-row md:items-start">
				<div class="h-24 w-24 shrink-0 rounded-full bg-gray-200"></div>
				<div class="min-w-0 flex-1 space-y-3">
					<div class="mx-auto h-8 w-48 rounded bg-gray-200 md:mx-0"></div>
					<div class="mx-auto h-4 w-64 rounded bg-gray-200 md:mx-0"></div>
					<div class="mx-auto h-3 w-56 rounded bg-gray-200 md:mx-0"></div>
					<div
						class="mx-auto mt-6 grid w-full max-w-xs grid-cols-2 gap-3 sm:gap-6 md:mx-0 md:max-w-sm"
					>
						<div class="h-16 rounded-xl bg-gray-200"></div>
						<div class="h-16 rounded-xl bg-gray-200"></div>
					</div>
				</div>
			</div>
		</Card>
	</section>
{:else if $authStore.user}
	<section class="mx-auto max-w-7xl space-y-8 py-4 sm:py-8">
		<Card size="xl" class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
			<div class="flex flex-col items-center gap-6 md:flex-row md:items-start">
				<Avatar
					size="xl"
					cornerStyle="circular"
					class="shrink-0 bg-primary-100 text-primary-600 ring-4 ring-primary-50"
				/>

				<div class="min-w-0 flex-1 text-center md:text-left">
					<h1 class="text-3xl font-bold wrap-break-word text-gray-900">
						{$authStore.user.username}
					</h1>
					<p
						class="mt-1 flex flex-col items-center gap-1 text-gray-500 sm:flex-row sm:justify-center sm:gap-2 md:justify-start"
					>
						<span class="wrap-break-word">@{$authStore.user.username}</span>
						<span class="hidden text-gray-300 sm:inline">·</span>
						<span class="whitespace-nowrap">
							{$translationStore.profile.memberSince}
							{memberDate}
						</span>
					</p>
					<p class="mt-1 text-sm break-all text-gray-500 sm:truncate">{$authStore.user.email}</p>

					<div
						class="mt-4 flex flex-col justify-center gap-2 sm:flex-row sm:flex-wrap md:justify-start"
					>
						<span
							class="inline-flex justify-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-green-200"
						>
							{$translationStore.profile.status}: {$authStore.user.status}
						</span>
						<span
							class="inline-flex justify-center rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200"
						>
							{$translationStore.profile.role}: {$authStore.user.role}
						</span>
					</div>

					<div
						class="mx-auto mt-6 grid w-full max-w-xs grid-cols-2 gap-3 sm:gap-6 md:mx-0 md:max-w-sm"
					>
						<div class="rounded-xl bg-gray-50 px-3 py-3 text-center">
							<span class="block text-2xl font-bold text-gray-900 tabular-nums"
								>{stats ? stats.offerCount : '—'}</span
							>
							<span class="text-sm text-gray-500">{$translationStore.profile.offers}</span>
						</div>
						<div class="rounded-xl bg-gray-50 px-3 py-3 text-center">
							<span class="block text-2xl font-bold text-gray-900 tabular-nums"
								>{stats ? stats.commentCount : '—'}</span
							>
							<span class="text-sm text-gray-500">{$translationStore.profile.comments}</span>
						</div>
					</div>
				</div>
			</div>
		</Card>

		<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
			<Tabs
				bind:selected={selectedTab}
				tabStyle="underline"
				divider={false}
				class="overflow-x-auto"
				classes={{ content: 'pt-6' }}
			>
				<TabItem key="offers" open>
					{#snippet titleSlot()}
						<span class="flex items-center gap-2 whitespace-nowrap">
							<TagSolid class="h-4 w-4" />
							{$translationStore.profile.myOffers}
						</span>
					{/snippet}

					{#if offersLoading}
						<div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
							{#each offerSkeletons as skeleton (skeleton)}
								<DealCardSkeleton class="h-full" />
							{/each}
						</div>
					{:else if offersErrorMessage}
						<Card
							size="xl"
							class="rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-none"
							role="alert"
						>
							<p class="font-medium text-red-700">{offersErrorMessage}</p>
							<Button color="red" class="mt-4 rounded-full" onclick={loadMyOffers}>
								{$translationStore.profile.retry}
							</Button>
						</Card>
					{:else if myOffers.length > 0}
						<div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
							{#each myOffers as offer, index (offer.id)}
								<DealCard {offer} class="h-full">
									{#snippet actions()}
										<Button
											id={`profile-offer-actions-${index}`}
											color="light"
											size="xs"
											class="h-8 w-8 rounded-full p-0!"
											aria-label={$translationStore.profile.offerActions}
										>
											<DotsVerticalOutline class="h-4 w-4" />
										</Button>
										<Dropdown
											triggeredBy={`#profile-offer-actions-${index}`}
											placement="bottom-end"
										>
											<DropdownItem
												href={resolve('/deals/[id]/edit', { id: offer.id })}
												classes={{ li: 'list-none' }}
											>
												{$translationStore.deal.edit}
											</DropdownItem>
											<DropdownItem
												onclick={() => openDeleteModal(offer)}
												classes={{ li: 'list-none' }}
											>
												{$translationStore.deleteDeal.openButton}
											</DropdownItem>
										</Dropdown>
									{/snippet}
								</DealCard>
							{/each}
						</div>
					{:else}
						<Card
							size="xl"
							class="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center shadow-none"
						>
							<p class="font-medium text-gray-700">{$translationStore.profile.noOffers}</p>
							<p class="mt-2 text-sm text-gray-500">
								{$translationStore.profile.noOffersDescription}
							</p>
							<Button href={resolve('/create-deal')} class="mt-5 rounded-full">
								{$translationStore.profile.publishOffer}
							</Button>
						</Card>
					{/if}
				</TabItem>

				<TabItem key="comments">
					{#snippet titleSlot()}
						<span class="flex items-center gap-2 whitespace-nowrap">
							<MessageDotsOutline class="h-4 w-4" />
							{$translationStore.profile.myComments}
						</span>
					{/snippet}

					<Card
						size="xl"
						class="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center shadow-none"
					>
						<p class="font-medium text-gray-700">{$translationStore.profile.noComments}</p>
						<p class="mt-2 text-sm text-gray-500">{$translationStore.profile.comingSoon}</p>
					</Card>
				</TabItem>

				<TabItem key="votes">
					{#snippet titleSlot()}
						<span class="flex items-center gap-2 whitespace-nowrap">
							<FireSolid class="h-4 w-4" />
							{$translationStore.profile.myVotes}
						</span>
					{/snippet}

					<Card
						size="xl"
						class="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center shadow-none"
					>
						<p class="font-medium text-gray-700">{$translationStore.profile.noVotes}</p>
						<p class="mt-2 text-sm text-gray-500">{$translationStore.profile.comingSoon}</p>
					</Card>
				</TabItem>
			</Tabs>
		</div>
	</section>
{/if}

{#if deleteTarget}
	<Modal bind:open={deleteModalOpen} title={$translationStore.deleteDeal.title} size="md">
		<div class="space-y-4">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
				<TrashBinOutline class="h-6 w-6" />
			</div>
			<p class="text-sm leading-6 text-slate-600">
				{$translationStore.deleteDeal.description}
			</p>
			<p class="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
				{deleteTarget.title}
			</p>
		</div>

		{#snippet footer()}
			<div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
				<Button
					color="alternative"
					class="w-full sm:w-auto"
					disabled={Boolean(deletingOfferId)}
					onclick={closeDeleteModal}
				>
					{$translationStore.deleteDeal.cancel}
				</Button>
				<Button
					color="red"
					class="w-full sm:w-auto"
					loading={isDeletingTarget}
					disabled={Boolean(deletingOfferId)}
					onclick={handleDeleteOffer}
				>
					{isDeletingTarget
						? $translationStore.deleteDeal.deleting
						: $translationStore.deleteDeal.confirm}
				</Button>
			</div>
		{/snippet}
	</Modal>
{/if}
