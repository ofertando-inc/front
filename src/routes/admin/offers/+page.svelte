<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { Button, Modal, Select, Spinner } from 'flowbite-svelte';
	import { disableOffer, disableUser, listAdminOffers, restoreOffer } from '$lib/api/admin';
	import DealStatusBadge from '$lib/components/offers/DealStatusBadge.svelte';
	import { translationStore } from '$lib/i18n';
	import { resolveOfferError } from '$lib/offers/offerErrors';
	import { OFFER_STATUSES, type Offer, type OfferStatus } from '$lib/types/offer';

	let offers = $state<Offer[]>([]);
	let nextCursor = $state<string | null>(null);
	let statusFilter = $state<OfferStatus | ''>('');
	let loading = $state(true);
	let loadingMore = $state(false);
	let pendingOfferId = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);
	let feedback = $state<string | null>(null);

	let disableAuthorTarget = $state<Offer | null>(null);
	let disableAuthorModalOpen = $state(false);
	let disablingAuthor = $state(false);

	function openDisableAuthor(offer: Offer) {
		disableAuthorTarget = offer;
		disableAuthorModalOpen = true;
	}

	onMount(() => {
		void loadOffers();
	});

	async function loadOffers() {
		loading = true;
		errorMessage = null;

		try {
			const res = await listAdminOffers({
				limit: 20,
				sort: 'date',
				status: statusFilter || undefined
			});
			offers = res.items;
			nextCursor = res.nextCursor;
		} catch (error) {
			errorMessage = resolveOfferError(error, $translationStore, 'browse').bannerMessage;
		} finally {
			loading = false;
		}
	}

	async function loadMore() {
		if (!nextCursor || loadingMore) return;
		loadingMore = true;
		errorMessage = null;

		try {
			const res = await listAdminOffers({
				limit: 20,
				sort: 'date',
				status: statusFilter || undefined,
				cursor: nextCursor
			});
			offers = [...offers, ...res.items];
			nextCursor = res.nextCursor;
		} catch (error) {
			errorMessage = resolveOfferError(error, $translationStore, 'browse').bannerMessage;
		} finally {
			loadingMore = false;
		}
	}

	function handleFilterChange() {
		nextCursor = null;
		void loadOffers();
	}

	function replaceOffer(updated: Offer) {
		offers = offers.map((offer) => (offer.id === updated.id ? updated : offer));
	}

	async function handleDisable(offer: Offer) {
		if (pendingOfferId) return;
		pendingOfferId = offer.id;
		errorMessage = null;
		feedback = null;

		try {
			replaceOffer(await disableOffer(offer.id));
		} catch {
			errorMessage = $translationStore.admin.actionError;
		} finally {
			pendingOfferId = null;
		}
	}

	async function handleRestore(offer: Offer) {
		if (pendingOfferId) return;
		pendingOfferId = offer.id;
		errorMessage = null;
		feedback = null;

		try {
			replaceOffer(await restoreOffer(offer.id));
		} catch {
			errorMessage = $translationStore.admin.actionError;
		} finally {
			pendingOfferId = null;
		}
	}

	async function confirmDisableAuthor() {
		if (!disableAuthorTarget || disablingAuthor) return;
		disablingAuthor = true;
		errorMessage = null;
		feedback = null;

		try {
			await disableUser(disableAuthorTarget.createdById);
			feedback = $translationStore.admin.authorDisabledFeedback;
			disableAuthorModalOpen = false;
			disableAuthorTarget = null;
		} catch {
			errorMessage = $translationStore.admin.actionError;
		} finally {
			disablingAuthor = false;
		}
	}
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center gap-3">
		<label for="admin-status-filter" class="text-sm font-medium text-gray-700">
			{$translationStore.admin.filterStatusLabel}
		</label>
		<Select
			id="admin-status-filter"
			bind:value={statusFilter}
			onchange={handleFilterChange}
			class="w-48"
			placeholder=""
		>
			<option value="">{$translationStore.admin.filterStatusAll}</option>
			{#each OFFER_STATUSES as status (status)}
				<option value={status}>{$translationStore.offerStatus[status]}</option>
			{/each}
		</Select>
	</div>

	{#if errorMessage}
		<p
			role="alert"
			class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
		>
			{errorMessage}
		</p>
	{/if}

	{#if feedback}
		<p
			role="status"
			class="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
		>
			{feedback}
		</p>
	{/if}

	{#if loading}
		<div class="flex justify-center py-12">
			<Spinner />
		</div>
	{:else if offers.length === 0}
		<p class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-500">
			{$translationStore.admin.offersEmpty}
		</p>
	{:else}
		<div class="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
			<table class="w-full min-w-3xl text-left text-sm">
				<thead class="bg-gray-50 text-xs tracking-wide text-gray-500 uppercase">
					<tr>
						<th class="px-4 py-3">{$translationStore.admin.thOffer}</th>
						<th class="px-4 py-3">{$translationStore.admin.thAuthor}</th>
						<th class="px-4 py-3">{$translationStore.admin.thStatus}</th>
						<th class="px-4 py-3 text-right">{$translationStore.admin.thScore}</th>
						<th class="px-4 py-3 text-right">{$translationStore.admin.thReports}</th>
						<th class="px-4 py-3 text-right">{$translationStore.admin.thActions}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each offers as offer (offer.id)}
						<tr class="transition-colors hover:bg-gray-50">
							<td class="px-4 py-3">
								<a
									href={resolve('/deals/[id]', { id: offer.id })}
									class="font-medium text-gray-900 hover:text-primary-600"
								>
									{offer.title}
								</a>
							</td>
							<td class="px-4 py-3 text-gray-600">{offer.createdByUsername}</td>
							<td class="px-4 py-3"><DealStatusBadge status={offer.status} /></td>
							<td class="px-4 py-3 text-right text-gray-700 tabular-nums">{offer.score}</td>
							<td class="px-4 py-3 text-right text-gray-700 tabular-nums">{offer.reportCount}</td>
							<td class="px-4 py-3">
								<div class="flex justify-end gap-2">
									{#if offer.status === 'DISABLED'}
										<Button
											size="xs"
											color="alternative"
											disabled={pendingOfferId === offer.id}
											onclick={() => handleRestore(offer)}
										>
											{$translationStore.admin.actionRestore}
										</Button>
									{:else}
										<Button
											size="xs"
											color="red"
											disabled={pendingOfferId === offer.id}
											onclick={() => handleDisable(offer)}
										>
											{$translationStore.admin.actionDisable}
										</Button>
									{/if}
									<Button size="xs" color="alternative" onclick={() => openDisableAuthor(offer)}>
										{$translationStore.admin.actionDisableAuthor}
									</Button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if nextCursor}
			<div class="flex justify-center pt-2">
				<Button color="alternative" disabled={loadingMore} onclick={loadMore}>
					{loadingMore ? $translationStore.common.loading : $translationStore.admin.loadMore}
				</Button>
			</div>
		{/if}
	{/if}
</div>

<Modal
	bind:open={disableAuthorModalOpen}
	title={$translationStore.admin.disableAuthorTitle}
	size="md"
>
	<p class="text-sm leading-6 text-slate-600">
		{$translationStore.admin.disableAuthorDescription}
	</p>
	{#if disableAuthorTarget}
		<p class="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
			{disableAuthorTarget.createdByUsername}
		</p>
	{/if}

	{#snippet footer()}
		<div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
			<Button
				color="alternative"
				class="w-full sm:w-auto"
				disabled={disablingAuthor}
				onclick={() => (disableAuthorModalOpen = false)}
			>
				{$translationStore.admin.disableAuthorCancel}
			</Button>
			<Button
				color="red"
				class="w-full sm:w-auto"
				loading={disablingAuthor}
				disabled={disablingAuthor}
				onclick={confirmDisableAuthor}
			>
				{disablingAuthor
					? $translationStore.admin.disablingAuthor
					: $translationStore.admin.disableAuthorConfirm}
			</Button>
		</div>
	{/snippet}
</Modal>
