<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Modal, Spinner } from 'flowbite-svelte';
	import { CheckCircleOutline } from 'flowbite-svelte-icons';
	import {
		listAdminLocations,
		listAdminMerchants,
		mergeMerchants,
		verifyLocation,
		verifyMerchant
	} from '$lib/api/admin';
	import LocationMap from '$lib/components/offers/LocationMap.svelte';
	import MerchantCombobox from '$lib/components/offers/MerchantCombobox.svelte';
	import { localeStore, translationStore } from '$lib/i18n';
	import { resolveOfferError } from '$lib/offers/offerErrors';
	import type { AdminLocation } from '$lib/types/admin';
	import type { MerchantResponse } from '$lib/types/merchant';

	let merchants = $state<MerchantResponse[]>([]);
	let merchantsCursor = $state<string | null>(null);
	let locations = $state<AdminLocation[]>([]);
	let locationsCursor = $state<string | null>(null);

	let loading = $state(true);
	let loadingMoreMerchants = $state(false);
	let loadingMoreLocations = $state(false);
	let pendingId = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);
	// Location row whose map is expanded (lazily mounted, one at a time).
	let expandedLocationId = $state<string | null>(null);

	function toggleMap(id: string) {
		expandedLocationId = expandedLocationId === id ? null : id;
	}

	// Merge dialog.
	let mergeOpen = $state(false);
	let mergeSource = $state<MerchantResponse | null>(null);
	let mergeTargetId = $state<string | undefined>(undefined);
	let mergeTargetName = $state('');
	let merging = $state(false);

	let dateFormatter = $derived(
		new Intl.DateTimeFormat($localeStore, { day: 'numeric', month: 'short', year: 'numeric' })
	);

	let canMerge = $derived(
		Boolean(mergeSource && mergeTargetId && mergeTargetId !== mergeSource.id)
	);

	onMount(() => void load());

	async function load() {
		loading = true;
		errorMessage = null;
		try {
			const [m, l] = await Promise.all([
				listAdminMerchants({ verified: false, limit: 20 }),
				listAdminLocations({ verified: false, limit: 20 })
			]);
			merchants = m.items;
			merchantsCursor = m.nextCursor;
			locations = l.items;
			locationsCursor = l.nextCursor;
		} catch (error) {
			errorMessage = resolveOfferError(error, $translationStore, 'browse').bannerMessage;
		} finally {
			loading = false;
		}
	}

	async function loadMoreMerchants() {
		if (!merchantsCursor || loadingMoreMerchants) return;
		loadingMoreMerchants = true;
		try {
			const res = await listAdminMerchants({ verified: false, limit: 20, cursor: merchantsCursor });
			merchants = [...merchants, ...res.items];
			merchantsCursor = res.nextCursor;
		} catch {
			errorMessage = $translationStore.admin.actionError;
		} finally {
			loadingMoreMerchants = false;
		}
	}

	async function loadMoreLocations() {
		if (!locationsCursor || loadingMoreLocations) return;
		loadingMoreLocations = true;
		try {
			const res = await listAdminLocations({ verified: false, limit: 20, cursor: locationsCursor });
			locations = [...locations, ...res.items];
			locationsCursor = res.nextCursor;
		} catch {
			errorMessage = $translationStore.admin.actionError;
		} finally {
			loadingMoreLocations = false;
		}
	}

	async function handleVerifyMerchant(merchant: MerchantResponse) {
		if (pendingId) return;
		pendingId = merchant.id;
		errorMessage = null;
		try {
			await verifyMerchant(merchant.id);
			merchants = merchants.filter((m) => m.id !== merchant.id);
		} catch {
			errorMessage = $translationStore.admin.actionError;
		} finally {
			pendingId = null;
		}
	}

	async function handleVerifyLocation(location: AdminLocation) {
		if (pendingId) return;
		pendingId = location.id;
		errorMessage = null;
		try {
			await verifyLocation(location.id);
			locations = locations.filter((l) => l.id !== location.id);
		} catch {
			errorMessage = $translationStore.admin.actionError;
		} finally {
			pendingId = null;
		}
	}

	function openMerge(merchant: MerchantResponse) {
		mergeSource = merchant;
		mergeTargetId = undefined;
		mergeTargetName = '';
		mergeOpen = true;
	}

	async function confirmMerge() {
		if (!mergeSource || !canMerge || merging) return;
		merging = true;
		errorMessage = null;
		try {
			await mergeMerchants({ sourceId: mergeSource.id, targetId: mergeTargetId! });
			merchants = merchants.filter((m) => m.id !== mergeSource!.id);
			mergeOpen = false;
		} catch {
			errorMessage = $translationStore.admin.actionError;
		} finally {
			merging = false;
		}
	}
</script>

<div class="space-y-8">
	{#if errorMessage}
		<p
			role="alert"
			class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
		>
			{errorMessage}
		</p>
	{/if}

	{#if loading}
		<div class="flex justify-center py-12"><Spinner /></div>
	{:else}
		<section class="space-y-3">
			<h2 class="font-bold text-gray-900">{$translationStore.admin.merchantsSection}</h2>
			{#if merchants.length === 0}
				<p
					class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-500"
				>
					{$translationStore.admin.merchantsEmpty}
				</p>
			{:else}
				<div class="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
					<table class="w-full min-w-2xl text-left text-sm">
						<thead class="bg-gray-50 text-xs tracking-wide text-gray-500 uppercase">
							<tr>
								<th class="px-4 py-3">{$translationStore.admin.thMerchant}</th>
								<th class="px-4 py-3">{$translationStore.admin.thCreated}</th>
								<th class="px-4 py-3 text-right">{$translationStore.admin.thActions}</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{#each merchants as merchant (merchant.id)}
								<tr class="transition-colors hover:bg-gray-50">
									<td class="px-4 py-3 font-medium text-gray-900">{merchant.name}</td>
									<td class="px-4 py-3 text-gray-500">
										{dateFormatter.format(new Date(merchant.createdAt))}
									</td>
									<td class="px-4 py-3">
										<div class="flex flex-wrap justify-end gap-2">
											<Button
												size="xs"
												color="alternative"
												disabled={pendingId === merchant.id}
												onclick={() => openMerge(merchant)}
											>
												{$translationStore.admin.actionMerge}
											</Button>
											<Button
												size="xs"
												disabled={pendingId === merchant.id}
												onclick={() => handleVerifyMerchant(merchant)}
											>
												<span class="flex items-center gap-1">
													<CheckCircleOutline class="h-4 w-4" />
													{pendingId === merchant.id
														? $translationStore.admin.verifying
														: $translationStore.admin.actionVerify}
												</span>
											</Button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				{#if merchantsCursor}
					<div class="flex justify-center pt-1">
						<Button color="alternative" disabled={loadingMoreMerchants} onclick={loadMoreMerchants}>
							{loadingMoreMerchants
								? $translationStore.common.loading
								: $translationStore.admin.loadMore}
						</Button>
					</div>
				{/if}
			{/if}
		</section>

		<section class="space-y-3">
			<h2 class="font-bold text-gray-900">{$translationStore.admin.locationsSection}</h2>
			{#if locations.length === 0}
				<p
					class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-500"
				>
					{$translationStore.admin.locationsEmpty}
				</p>
			{:else}
				<div class="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
					<table class="w-full min-w-3xl text-left text-sm">
						<thead class="bg-gray-50 text-xs tracking-wide text-gray-500 uppercase">
							<tr>
								<th class="px-4 py-3">{$translationStore.admin.thAddress}</th>
								<th class="px-4 py-3">{$translationStore.admin.thMerchant}</th>
								<th class="px-4 py-3">{$translationStore.admin.thCreated}</th>
								<th class="px-4 py-3 text-right">{$translationStore.admin.thActions}</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{#each locations as location (location.id)}
								<tr class="transition-colors hover:bg-gray-50">
									<td class="px-4 py-3 text-gray-700">
										<span class="font-medium text-gray-900">{location.address}</span>
										<span class="block text-xs text-gray-400">{location.city}</span>
									</td>
									<td class="px-4 py-3 text-gray-600">{location.merchant.name}</td>
									<td class="px-4 py-3 text-gray-500">
										{dateFormatter.format(new Date(location.createdAt))}
									</td>
									<td class="px-4 py-3">
										<div class="flex flex-wrap justify-end gap-2">
											{#if location.latitude != null && location.longitude != null}
												<Button
													size="xs"
													color="alternative"
													onclick={() => toggleMap(location.id)}
												>
													{expandedLocationId === location.id
														? $translationStore.admin.hideMap
														: $translationStore.admin.viewMap}
												</Button>
											{/if}
											<Button
												size="xs"
												disabled={pendingId === location.id}
												onclick={() => handleVerifyLocation(location)}
											>
												<span class="flex items-center gap-1">
													<CheckCircleOutline class="h-4 w-4" />
													{pendingId === location.id
														? $translationStore.admin.verifying
														: $translationStore.admin.actionVerify}
												</span>
											</Button>
										</div>
									</td>
								</tr>
								{#if expandedLocationId === location.id && location.latitude != null && location.longitude != null}
									<tr class="bg-gray-50">
										<td colspan="4" class="px-4 py-3">
											<LocationMap latitude={location.latitude} longitude={location.longitude} />
										</td>
									</tr>
								{/if}
							{/each}
						</tbody>
					</table>
				</div>

				{#if locationsCursor}
					<div class="flex justify-center pt-1">
						<Button color="alternative" disabled={loadingMoreLocations} onclick={loadMoreLocations}>
							{loadingMoreLocations
								? $translationStore.common.loading
								: $translationStore.admin.loadMore}
						</Button>
					</div>
				{/if}
			{/if}
		</section>
	{/if}
</div>

<Modal bind:open={mergeOpen} title={$translationStore.admin.mergeTitle} size="md">
	<div class="space-y-4">
		<p class="text-sm leading-6 text-gray-600">
			{$translationStore.admin.mergeDescription.replace('{name}', mergeSource?.name ?? '')}
		</p>
		<div class="space-y-2">
			<label for="mergeTarget" class="text-sm font-medium text-gray-700">
				{$translationStore.admin.mergeTargetLabel}
			</label>
			<MerchantCombobox
				id="mergeTarget"
				bind:merchantName={mergeTargetName}
				bind:merchantId={mergeTargetId}
				placeholder={$translationStore.admin.mergeTargetPlaceholder}
			/>
		</div>
	</div>

	{#snippet footer()}
		<div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
			<Button color="alternative" disabled={merging} onclick={() => (mergeOpen = false)}>
				{$translationStore.admin.mergeCancel}
			</Button>
			<Button color="red" disabled={!canMerge || merging} onclick={confirmMerge}>
				{merging ? $translationStore.admin.mergeSubmitting : $translationStore.admin.mergeConfirm}
			</Button>
		</div>
	{/snippet}
</Modal>
