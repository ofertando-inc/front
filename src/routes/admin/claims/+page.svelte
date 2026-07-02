<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Modal, Spinner, Textarea } from 'flowbite-svelte';
	import { CheckCircleOutline } from 'flowbite-svelte-icons';
	import { approveClaim, listClaims, rejectClaim } from '$lib/api/admin';
	import { ApiError } from '$lib/api/client';
	import { localeStore, translationStore } from '$lib/i18n';
	import { resolveOfferError } from '$lib/offers/offerErrors';
	import type { ClaimResponse, ClaimStatus } from '$lib/types/admin';

	type ClaimFilter = ClaimStatus | 'all';

	let claims = $state<ClaimResponse[]>([]);
	let cursor = $state<string | null>(null);
	let loading = $state(true);
	let listLoading = $state(false);
	let loadingMore = $state(false);
	let pendingId = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);
	let statusFilter = $state<ClaimFilter>('PENDING');

	let dateFormatter = $derived(
		new Intl.DateTimeFormat($localeStore, { day: 'numeric', month: 'short', year: 'numeric' })
	);

	let statusLabels = $derived<Record<ClaimStatus, string>>({
		PENDING: $translationStore.admin.claimStatusPending,
		APPROVED: $translationStore.admin.claimStatusApproved,
		REJECTED: $translationStore.admin.claimStatusRejected
	});

	function claimsQuery() {
		return statusFilter === 'all' ? {} : { status: statusFilter };
	}

	function showError(error: unknown) {
		if (error instanceof ApiError) {
			const key = error.key;
			if (key && key in $translationStore.errors) {
				errorMessage = $translationStore.errors[key as keyof typeof $translationStore.errors];
				return;
			}
		}
		errorMessage = $translationStore.admin.actionError;
	}

	onMount(() => void load());

	async function load() {
		loading = true;
		errorMessage = null;
		try {
			const res = await listClaims({ ...claimsQuery(), limit: 20 });
			claims = res.items;
			cursor = res.nextCursor;
		} catch (error) {
			errorMessage = resolveOfferError(error, $translationStore, 'browse').bannerMessage;
		} finally {
			loading = false;
		}
	}

	async function reload() {
		listLoading = true;
		errorMessage = null;
		try {
			const res = await listClaims({ ...claimsQuery(), limit: 20 });
			claims = res.items;
			cursor = res.nextCursor;
		} catch (error) {
			showError(error);
		} finally {
			listLoading = false;
		}
	}

	function setFilter(filter: ClaimFilter) {
		if (statusFilter === filter) return;
		statusFilter = filter;
		void reload();
	}

	async function loadMore() {
		if (!cursor || loadingMore) return;
		loadingMore = true;
		try {
			const res = await listClaims({ ...claimsQuery(), limit: 20, cursor });
			claims = [...claims, ...res.items];
			cursor = res.nextCursor;
		} catch (error) {
			showError(error);
		} finally {
			loadingMore = false;
		}
	}

	function settleClaim(updated: ClaimResponse) {
		// The pending queue drops resolved claims; other filters show them updated.
		if (statusFilter === 'PENDING') {
			claims = claims.filter((c) => c.id !== updated.id);
		} else {
			claims = claims.map((c) => (c.id === updated.id ? updated : c));
		}
	}

	async function handleApprove(claim: ClaimResponse) {
		if (pendingId) return;
		pendingId = claim.id;
		errorMessage = null;
		try {
			const updated = await approveClaim(claim.id);
			settleClaim(updated);
		} catch (error) {
			showError(error);
		} finally {
			pendingId = null;
		}
	}

	// --- Reject dialog (with optional note stored on the claim) ---
	let rejectOpen = $state(false);
	let rejectTarget = $state<ClaimResponse | null>(null);
	let rejectNote = $state('');
	let rejecting = $state(false);

	function openReject(claim: ClaimResponse) {
		rejectTarget = claim;
		rejectNote = '';
		rejectOpen = true;
	}

	async function confirmReject() {
		if (!rejectTarget || rejecting) return;
		rejecting = true;
		errorMessage = null;
		try {
			const note = rejectNote.trim();
			const updated = await rejectClaim(rejectTarget.id, note ? { note } : {});
			settleClaim(updated);
			rejectOpen = false;
		} catch (error) {
			showError(error);
			rejectOpen = false;
		} finally {
			rejecting = false;
		}
	}
</script>

<div class="space-y-4">
	{#if errorMessage}
		<p
			role="alert"
			class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
		>
			{errorMessage}
		</p>
	{/if}

	<div class="inline-flex rounded-full border border-gray-200 bg-white p-1">
		{#each [['PENDING', $translationStore.admin.claimStatusPending], ['APPROVED', $translationStore.admin.claimStatusApproved], ['REJECTED', $translationStore.admin.claimStatusRejected], ['all', $translationStore.admin.filterAll]] as [value, label] (value)}
			<button
				type="button"
				onclick={() => setFilter(value as ClaimFilter)}
				aria-pressed={statusFilter === value}
				class="rounded-full px-3 py-1 text-sm font-medium transition-colors {statusFilter === value
					? 'bg-primary-500 text-white shadow-sm'
					: 'text-gray-600 hover:text-primary-600'}"
			>
				{label}
			</button>
		{/each}
	</div>

	{#if loading || listLoading}
		<div class="flex justify-center py-12"><Spinner /></div>
	{:else if claims.length === 0}
		<p class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-500">
			{$translationStore.admin.claimsEmpty}
		</p>
	{:else}
		<div class="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
			<table class="w-full min-w-3xl text-left text-sm">
				<thead class="bg-gray-50 text-xs tracking-wide text-gray-500 uppercase">
					<tr>
						<th class="px-4 py-3">{$translationStore.admin.thAccount}</th>
						<th class="px-4 py-3">{$translationStore.admin.thMerchant}</th>
						<th class="px-4 py-3">{$translationStore.admin.thStatus}</th>
						<th class="px-4 py-3">{$translationStore.admin.thCreated}</th>
						<th class="px-4 py-3 text-right">{$translationStore.admin.thActions}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each claims as claim (claim.id)}
						<tr class="transition-colors hover:bg-gray-50">
							<td class="px-4 py-3">
								<span class="font-medium text-gray-900">{claim.user.username}</span>
								<span class="block text-xs text-gray-400">{claim.user.email}</span>
							</td>
							<td class="px-4 py-3 text-gray-700">{claim.merchant.name}</td>
							<td class="px-4 py-3">
								<span
									class="rounded-full px-2 py-0.5 text-xs font-medium {claim.status === 'APPROVED'
										? 'bg-savings-50 text-savings-700'
										: claim.status === 'REJECTED'
											? 'bg-red-50 text-red-700'
											: 'bg-amber-50 text-amber-700'}"
								>
									{statusLabels[claim.status]}
								</span>
								{#if claim.reviewedBy}
									<span class="block pt-1 text-xs text-gray-400">
										{$translationStore.admin.reviewedBy}
										{claim.reviewedBy.username}
									</span>
								{/if}
								{#if claim.note}
									<span class="block pt-1 text-xs text-gray-500">{claim.note}</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-gray-500">
								{dateFormatter.format(new Date(claim.createdAt))}
							</td>
							<td class="px-4 py-3">
								{#if claim.status === 'PENDING'}
									<div class="flex flex-wrap justify-end gap-2">
										<Button
											size="xs"
											color="red"
											outline
											disabled={pendingId === claim.id}
											onclick={() => openReject(claim)}
										>
											{$translationStore.admin.actionReject}
										</Button>
										<Button
											size="xs"
											disabled={pendingId === claim.id}
											onclick={() => handleApprove(claim)}
										>
											<span class="flex items-center gap-1">
												<CheckCircleOutline class="h-4 w-4" />
												{$translationStore.admin.actionApprove}
											</span>
										</Button>
									</div>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if cursor}
			<div class="flex justify-center pt-1">
				<Button color="alternative" disabled={loadingMore} onclick={loadMore}>
					{loadingMore ? $translationStore.common.loading : $translationStore.admin.loadMore}
				</Button>
			</div>
		{/if}
	{/if}
</div>

<!-- Reject claim -->
<Modal bind:open={rejectOpen} title={$translationStore.admin.rejectTitle} size="md">
	<div class="space-y-4">
		<p class="text-sm leading-6 text-gray-600">
			{$translationStore.admin.rejectDescription
				.replace('{merchant}', rejectTarget?.merchant.name ?? '')
				.replace('{user}', rejectTarget?.user.username ?? '')}
		</p>
		<div class="space-y-2">
			<label for="rejectNote" class="text-sm font-medium text-gray-700">
				{$translationStore.admin.rejectNoteLabel}
			</label>
			<Textarea id="rejectNote" bind:value={rejectNote} rows={3} maxlength={2000} />
		</div>
	</div>
	{#snippet footer()}
		<div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
			<Button color="alternative" disabled={rejecting} onclick={() => (rejectOpen = false)}>
				{$translationStore.admin.cancel}
			</Button>
			<Button color="red" disabled={rejecting} onclick={confirmReject}>
				{rejecting ? $translationStore.admin.saving : $translationStore.admin.actionReject}
			</Button>
		</div>
	{/snippet}
</Modal>
