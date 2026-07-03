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
		Input,
		Label,
		Modal,
		TabItem,
		Tabs
	} from 'flowbite-svelte';
	import {
		ChevronDownOutline,
		ChevronUpOutline,
		DotsVerticalOutline,
		EditOutline,
		EyeSlashOutline,
		FireSolid,
		MessageDotsOutline,
		TagSolid,
		TrashBinOutline
	} from 'flowbite-svelte-icons';
	import { getMyStats, updateMe } from '$lib/api/auth';
	import { ApiError } from '$lib/api/client';
	import { deleteOffer, getMyOffers } from '$lib/api/offers';
	import { getMyComments, getMyVotes } from '$lib/api/profile';
	import { resolveAuthError } from '$lib/auth/authErrors';
	import DealCard from '$lib/components/offers/DealCard.svelte';
	import DealCardSkeleton from '$lib/components/offers/DealCardSkeleton.svelte';
	import { ErrorKey } from '$lib/errors/errorKeys';
	import { authStore } from '$lib/stores/auth';
	import { localeStore, translationStore } from '$lib/i18n';
	import { resolveOfferError, type OfferContext } from '$lib/offers/offerErrors';
	import type { UpdateMeDto, UserStats } from '$lib/types/auth';
	import type { Offer } from '$lib/types/offer';
	import type { MyComment, MyVote } from '$lib/types/profile';

	let loading = $state(true);
	let offersLoading = $state(false);
	let selectedTab = $state('offers');
	let myOffers = $state<Offer[]>([]);
	let stats = $state<UserStats | null>(null);

	const ACTIVITY_LIMIT = 20;

	let myComments = $state<MyComment[]>([]);
	let commentsCursor = $state<string | null>(null);
	let commentsLoaded = $state(false);
	let commentsLoading = $state(false);
	let commentsLoadingMore = $state(false);
	let commentsError = $state<unknown>(null);

	let myVotes = $state<MyVote[]>([]);
	let votesCursor = $state<string | null>(null);
	let votesLoaded = $state(false);
	let votesLoading = $state(false);
	let votesLoadingMore = $state(false);
	let votesError = $state<unknown>(null);
	let offersError = $state<{ error: unknown; context: OfferContext } | null>(null);
	let deleteModalOpen = $state(false);
	let deleteTarget = $state<Offer | null>(null);
	let deletingOfferId = $state<string | null>(null);

	let editModalOpen = $state(false);
	let editUsername = $state('');
	let editEmail = $state('');
	let editPassword = $state('');
	let editCurrentPassword = $state('');
	let editFieldErrors = $state<Record<string, string>>({});
	let editBannerError = $state<string | null>(null);
	let editSubmitting = $state(false);

	const offerSkeletons = [0, 1, 2];

	let isDeletingTarget = $derived(Boolean(deleteTarget && deletingOfferId === deleteTarget.id));
	let offersErrorMessage = $derived(
		offersError
			? resolveOfferError(offersError.error, $translationStore, offersError.context).bannerMessage
			: null
	);
	let commentsErrorMessage = $derived(
		commentsError
			? resolveOfferError(commentsError, $translationStore, 'comment').bannerMessage
			: null
	);
	let votesErrorMessage = $derived(
		votesError ? resolveOfferError(votesError, $translationStore, 'vote').bannerMessage : null
	);

	function formatActivityDate(iso: string): string {
		return new Intl.DateTimeFormat($localeStore, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(iso));
	}

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

	async function loadMyComments() {
		commentsLoaded = true;
		commentsLoading = true;
		commentsError = null;

		try {
			const response = await getMyComments({ limit: ACTIVITY_LIMIT });
			myComments = response.items;
			commentsCursor = response.nextCursor;
		} catch (error) {
			if (await redirectIfAuthError(error)) return;
			commentsError = error;
		} finally {
			commentsLoading = false;
		}
	}

	async function loadMoreComments() {
		if (commentsLoadingMore || !commentsCursor) return;
		commentsLoadingMore = true;
		commentsError = null;

		try {
			const response = await getMyComments({ limit: ACTIVITY_LIMIT, cursor: commentsCursor });
			myComments = [...myComments, ...response.items];
			commentsCursor = response.nextCursor;
		} catch (error) {
			if (await redirectIfAuthError(error)) return;
			commentsError = error;
		} finally {
			commentsLoadingMore = false;
		}
	}

	async function loadMyVotes() {
		votesLoaded = true;
		votesLoading = true;
		votesError = null;

		try {
			const response = await getMyVotes({ limit: ACTIVITY_LIMIT });
			myVotes = response.items;
			votesCursor = response.nextCursor;
		} catch (error) {
			if (await redirectIfAuthError(error)) return;
			votesError = error;
		} finally {
			votesLoading = false;
		}
	}

	async function loadMoreVotes() {
		if (votesLoadingMore || !votesCursor) return;
		votesLoadingMore = true;
		votesError = null;

		try {
			const response = await getMyVotes({ limit: ACTIVITY_LIMIT, cursor: votesCursor });
			myVotes = [...myVotes, ...response.items];
			votesCursor = response.nextCursor;
		} catch (error) {
			if (await redirectIfAuthError(error)) return;
			votesError = error;
		} finally {
			votesLoadingMore = false;
		}
	}

	// Lazy-load each activity tab the first time it is opened. The loaders flip
	// their `*Loaded` flag synchronously, so this never re-fires for the same tab
	// (and a failed load surfaces a retry button instead of looping).
	$effect(() => {
		if (selectedTab === 'comments' && !commentsLoaded) void loadMyComments();
		else if (selectedTab === 'votes' && !votesLoaded) void loadMyVotes();
	});

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

	function openEditModal() {
		if (!$authStore.user) return;
		editUsername = $authStore.user.username;
		editEmail = $authStore.user.email;
		editPassword = '';
		editCurrentPassword = '';
		editFieldErrors = {};
		editBannerError = null;
		editModalOpen = true;
	}

	function closeEditModal() {
		if (editSubmitting) return;
		editModalOpen = false;
	}

	async function handleUpdateProfile(event: SubmitEvent) {
		event.preventDefault();
		const current = $authStore.user;
		if (!current || editSubmitting) return;

		editFieldErrors = {};
		editBannerError = null;

		// Only send the fields that actually changed (an empty new-password field
		// means "keep the current password").
		const payload: UpdateMeDto = {};
		const username = editUsername.trim();
		const email = editEmail.trim();
		if (username && username !== current.username) payload.username = username;
		if (email && email !== current.email) payload.email = email;
		if (editPassword) payload.password = editPassword;
		if (editCurrentPassword) payload.currentPassword = editCurrentPassword;

		const changesIdentity = payload.email !== undefined || payload.password !== undefined;
		if (payload.username === undefined && !changesIdentity) {
			editModalOpen = false;
			return;
		}

		// Mirror the backend rules client-side for instant feedback.
		if (payload.password !== undefined && payload.password.length < 8) {
			editFieldErrors = { password: $translationStore.auth.passwordTooShort };
			return;
		}
		if (changesIdentity && !payload.currentPassword) {
			editFieldErrors = {
				currentPassword: $translationStore.errors['user.current_password_required']
			};
			return;
		}

		editSubmitting = true;
		try {
			const updated = await updateMe(payload);
			authStore.setUser(updated);
			editModalOpen = false;
		} catch (error) {
			if (await redirectIfAuthError(error)) return;
			const resolved = resolveAuthError(error, $translationStore, 'editProfile');
			editFieldErrors = resolved.fieldErrors;
			editBannerError = resolved.bannerMessage;
		} finally {
			editSubmitting = false;
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
	<meta name="robots" content="noindex" />
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
						class="mx-auto mt-6 grid w-full max-w-sm grid-cols-3 gap-3 sm:gap-4 md:mx-0 md:max-w-md"
					>
						<div class="h-16 rounded-xl bg-gray-200"></div>
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
					role="presentation"
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

					<div class="mt-4 flex justify-center md:justify-start">
						<Button color="alternative" size="sm" class="rounded-full" onclick={openEditModal}>
							<EditOutline class="mr-2 h-4 w-4" />
							{$translationStore.profile.editProfile}
						</Button>
					</div>

					<div
						class="mx-auto mt-6 grid w-full max-w-sm grid-cols-3 gap-3 sm:gap-4 md:mx-0 md:max-w-md"
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
						<div class="rounded-xl bg-orange-50 px-3 py-3 text-center ring-1 ring-orange-100">
							<span class="block text-2xl font-bold text-primary-600 tabular-nums"
								>{$authStore.user.reputation}</span
							>
							<span class="text-sm text-gray-500">{$translationStore.profile.reputation}</span>
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
				classes={{
					content: 'pt-6',
					// AA contrast: the default underline-active tab is primary-600 (3.66:1).
					active: 'p-4 text-primary-700 border-b-2 border-primary-700 bg-transparent'
				}}
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

					{#if commentsLoading}
						<div class="space-y-3">
							{#each offerSkeletons as skeleton (skeleton)}
								<div class="h-20 animate-pulse rounded-xl bg-gray-100"></div>
							{/each}
						</div>
					{:else if commentsErrorMessage}
						<Card
							size="xl"
							class="rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-none"
							role="alert"
						>
							<p class="font-medium text-red-700">{commentsErrorMessage}</p>
							<Button color="red" class="mt-4 rounded-full" onclick={loadMyComments}>
								{$translationStore.profile.retry}
							</Button>
						</Card>
					{:else if myComments.length > 0}
						<div class="space-y-3">
							{#each myComments as comment (comment.id)}
								<a
									href={resolve('/deals/[id]', { id: comment.offer.id })}
									class="block rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-primary-200 hover:bg-orange-50/40"
								>
									<div class="flex items-start justify-between gap-3">
										<p class="line-clamp-1 text-sm font-semibold text-gray-900">
											{comment.offer.title}
										</p>
										{#if comment.hidden}
											<span
												class="shrink-0 text-gray-400"
												title={$translationStore.comments.hiddenPlaceholderModerator}
											>
												<EyeSlashOutline class="h-4 w-4" />
											</span>
										{/if}
									</div>
									<p class="mt-1.5 line-clamp-2 text-sm text-gray-600">{comment.content}</p>
									<div
										class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400"
									>
										<span>
											{formatActivityDate(comment.createdAt)}
											{#if comment.editedAt}
												· {$translationStore.comments.edited}
											{/if}
										</span>
										<span class="flex items-center gap-1 tabular-nums">
											<ChevronUpOutline class="h-3.5 w-3.5" />{comment.score}
										</span>
										<span class="flex items-center gap-1 tabular-nums">
											<MessageDotsOutline class="h-3.5 w-3.5" />{comment.replyCount}
										</span>
									</div>
								</a>
							{/each}
						</div>
						{#if commentsCursor}
							<div class="mt-4 flex justify-center">
								<Button
									color="alternative"
									class="rounded-full px-6"
									disabled={commentsLoadingMore}
									onclick={loadMoreComments}
								>
									{commentsLoadingMore
										? $translationStore.common.loading
										: $translationStore.deals.loadMore}
								</Button>
							</div>
						{/if}
					{:else}
						<Card
							size="xl"
							class="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center shadow-none"
						>
							<p class="font-medium text-gray-700">{$translationStore.profile.noComments}</p>
						</Card>
					{/if}
				</TabItem>

				<TabItem key="votes">
					{#snippet titleSlot()}
						<span class="flex items-center gap-2 whitespace-nowrap">
							<FireSolid class="h-4 w-4" />
							{$translationStore.profile.myVotes}
						</span>
					{/snippet}

					{#if votesLoading}
						<div class="space-y-3">
							{#each offerSkeletons as skeleton (skeleton)}
								<div class="h-16 animate-pulse rounded-xl bg-gray-100"></div>
							{/each}
						</div>
					{:else if votesErrorMessage}
						<Card
							size="xl"
							class="rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-none"
							role="alert"
						>
							<p class="font-medium text-red-700">{votesErrorMessage}</p>
							<Button color="red" class="mt-4 rounded-full" onclick={loadMyVotes}>
								{$translationStore.profile.retry}
							</Button>
						</Card>
					{:else if myVotes.length > 0}
						<div class="space-y-3">
							{#each myVotes as vote (vote.offer.id + vote.createdAt)}
								<a
									href={resolve('/deals/[id]', { id: vote.offer.id })}
									class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-primary-200 hover:bg-orange-50/40"
								>
									<span
										class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full {vote.type ===
										'UP'
											? 'bg-primary-50 text-primary-600'
											: 'bg-blue-50 text-blue-600'}"
										aria-label={vote.type === 'UP'
											? $translationStore.deals.voteUp
											: $translationStore.deals.voteDown}
									>
										{#if vote.type === 'UP'}
											<ChevronUpOutline class="h-5 w-5" strokeWidth="3" />
										{:else}
											<ChevronDownOutline class="h-5 w-5" strokeWidth="3" />
										{/if}
									</span>
									<div class="min-w-0 flex-1">
										<p class="line-clamp-1 text-sm font-semibold text-gray-900">
											{vote.offer.title}
										</p>
										<p class="text-xs text-gray-500">{formatActivityDate(vote.createdAt)}</p>
									</div>
									<span class="shrink-0 text-sm font-bold text-gray-700 tabular-nums">
										{vote.offer.score}°
									</span>
								</a>
							{/each}
						</div>
						{#if votesCursor}
							<div class="mt-4 flex justify-center">
								<Button
									color="alternative"
									class="rounded-full px-6"
									disabled={votesLoadingMore}
									onclick={loadMoreVotes}
								>
									{votesLoadingMore
										? $translationStore.common.loading
										: $translationStore.deals.loadMore}
								</Button>
							</div>
						{/if}
					{:else}
						<Card
							size="xl"
							class="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center shadow-none"
						>
							<p class="font-medium text-gray-700">{$translationStore.profile.noVotes}</p>
						</Card>
					{/if}
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

<Modal bind:open={editModalOpen} title={$translationStore.profile.editProfile} size="md">
	<form onsubmit={handleUpdateProfile} class="space-y-4">
		{#if editBannerError}
			<div
				role="alert"
				class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
			>
				{editBannerError}
			</div>
		{/if}

		<div class="space-y-2">
			<Label for="edit-username" class="text-sm font-medium text-gray-700">
				{$translationStore.auth.username}
			</Label>
			<Input
				id="edit-username"
				type="text"
				bind:value={editUsername}
				autocomplete="username"
				color={editFieldErrors.username ? 'red' : undefined}
			/>
			{#if editFieldErrors.username}
				<p class="text-sm text-red-600">{editFieldErrors.username}</p>
			{/if}
		</div>

		<div class="space-y-2">
			<Label for="edit-email" class="text-sm font-medium text-gray-700">
				{$translationStore.auth.email}
			</Label>
			<Input
				id="edit-email"
				type="email"
				bind:value={editEmail}
				autocomplete="email"
				color={editFieldErrors.email ? 'red' : undefined}
			/>
			{#if editFieldErrors.email}
				<p class="text-sm text-red-600">{editFieldErrors.email}</p>
			{/if}
		</div>

		<div class="space-y-2">
			<Label for="edit-password" class="text-sm font-medium text-gray-700">
				{$translationStore.profile.newPasswordLabel}
			</Label>
			<Input
				id="edit-password"
				type="password"
				bind:value={editPassword}
				autocomplete="new-password"
				color={editFieldErrors.password ? 'red' : undefined}
			/>
			<p class="text-sm text-gray-500">{$translationStore.profile.newPasswordHint}</p>
			{#if editFieldErrors.password}
				<p class="text-sm text-red-600">{editFieldErrors.password}</p>
			{/if}
		</div>

		<div class="space-y-2">
			<Label for="edit-current-password" class="text-sm font-medium text-gray-700">
				{$translationStore.profile.currentPasswordLabel}
			</Label>
			<Input
				id="edit-current-password"
				type="password"
				bind:value={editCurrentPassword}
				autocomplete="current-password"
				color={editFieldErrors.currentPassword ? 'red' : undefined}
			/>
			{#if editFieldErrors.currentPassword}
				<p class="text-sm text-red-600">{editFieldErrors.currentPassword}</p>
			{/if}
		</div>

		<div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
			<Button
				type="button"
				color="alternative"
				class="w-full sm:w-auto"
				disabled={editSubmitting}
				onclick={closeEditModal}
			>
				{$translationStore.profile.cancel}
			</Button>
			<Button type="submit" class="w-full sm:w-auto" disabled={editSubmitting}>
				{editSubmitting ? $translationStore.profile.saving : $translationStore.profile.save}
			</Button>
		</div>
	</form>
</Modal>
