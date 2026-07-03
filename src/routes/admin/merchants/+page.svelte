<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Input, Modal, Select, Spinner } from 'flowbite-svelte';
	import { CheckCircleOutline, SearchOutline } from 'flowbite-svelte-icons';
	import {
		blockMerchant,
		deleteLocation,
		editLocation,
		editMerchant,
		listAdminLocations,
		listAdminMerchants,
		mergeMerchants,
		unblockMerchant,
		verifyLocation,
		verifyMerchant
	} from '$lib/api/admin';
	import { ApiError } from '$lib/api/client';
	import LocationMap from '$lib/components/offers/LocationMap.svelte';
	import MerchantCombobox from '$lib/components/offers/MerchantCombobox.svelte';
	import { ErrorKey } from '$lib/errors/errorKeys';
	import { localeStore, translationStore } from '$lib/i18n';
	import { resolveOfferError } from '$lib/offers/offerErrors';
	import type { AdminLocation, AdminModerationListQuery } from '$lib/types/admin';
	import type { MerchantResponse } from '$lib/types/merchant';

	type MerchantFilter = 'pending' | 'verified' | 'blocked' | 'all';

	let merchants = $state<MerchantResponse[]>([]);
	let merchantsCursor = $state<string | null>(null);
	let locations = $state<AdminLocation[]>([]);
	let locationsCursor = $state<string | null>(null);

	let loading = $state(true);
	let merchantsLoading = $state(false);
	let loadingMoreMerchants = $state(false);
	let loadingMoreLocations = $state(false);
	let pendingId = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);
	let expandedLocationId = $state<string | null>(null);

	// Per-merchant address panel: all addresses (verified + pending) of one merchant.
	let expandedMerchantId = $state<string | null>(null);
	let merchantLocations = $state<AdminLocation[]>([]);
	let merchantLocationsLoading = $state(false);

	let merchantFilter = $state<MerchantFilter>('pending');
	let merchantSearch = $state('');
	let searchDebounce: ReturnType<typeof setTimeout> | undefined;

	let dateFormatter = $derived(
		new Intl.DateTimeFormat($localeStore, { day: 'numeric', month: 'short', year: 'numeric' })
	);

	function merchantQuery(): AdminModerationListQuery {
		const q = merchantSearch.trim() || undefined;
		if (merchantFilter === 'verified') return { verified: true, q };
		if (merchantFilter === 'blocked') return { blocked: true, q };
		if (merchantFilter === 'pending') return { verified: false, q };
		return { q };
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
			const [m, l] = await Promise.all([
				listAdminMerchants({ ...merchantQuery(), limit: 20 }),
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

	async function reloadMerchants() {
		merchantsLoading = true;
		errorMessage = null;
		try {
			const res = await listAdminMerchants({ ...merchantQuery(), limit: 20 });
			merchants = res.items;
			merchantsCursor = res.nextCursor;
		} catch (error) {
			showError(error);
		} finally {
			merchantsLoading = false;
		}
	}

	function setFilter(filter: MerchantFilter) {
		if (merchantFilter === filter) return;
		merchantFilter = filter;
		void reloadMerchants();
	}

	function onSearchInput() {
		clearTimeout(searchDebounce);
		searchDebounce = setTimeout(() => void reloadMerchants(), 300);
	}

	async function loadMoreMerchants() {
		if (!merchantsCursor || loadingMoreMerchants) return;
		loadingMoreMerchants = true;
		try {
			const res = await listAdminMerchants({
				...merchantQuery(),
				limit: 20,
				cursor: merchantsCursor
			});
			merchants = [...merchants, ...res.items];
			merchantsCursor = res.nextCursor;
		} catch (error) {
			showError(error);
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
		} catch (error) {
			showError(error);
		} finally {
			loadingMoreLocations = false;
		}
	}

	function replaceMerchant(updated: MerchantResponse) {
		merchants = merchants.map((m) => (m.id === updated.id ? updated : m));
	}

	function dropMerchant(id: string) {
		merchants = merchants.filter((m) => m.id !== id);
	}

	async function runMerchantAction(id: string, action: () => Promise<void>) {
		if (pendingId) return;
		pendingId = id;
		errorMessage = null;
		try {
			await action();
		} catch (error) {
			showError(error);
		} finally {
			pendingId = null;
		}
	}

	function handleVerifyMerchant(merchant: MerchantResponse) {
		void runMerchantAction(merchant.id, async () => {
			const updated = await verifyMerchant(merchant.id);
			if (merchantFilter === 'pending') dropMerchant(merchant.id);
			else replaceMerchant(updated);
		});
	}

	function handleBlockMerchant(merchant: MerchantResponse) {
		void runMerchantAction(merchant.id, async () => {
			const updated = await blockMerchant(merchant.id);
			replaceMerchant(updated);
		});
	}

	function handleUnblockMerchant(merchant: MerchantResponse) {
		void runMerchantAction(merchant.id, async () => {
			const updated = await unblockMerchant(merchant.id);
			if (merchantFilter === 'blocked') dropMerchant(merchant.id);
			else replaceMerchant(updated);
		});
	}

	function toggleMap(id: string) {
		expandedLocationId = expandedLocationId === id ? null : id;
	}

	// Location actions can fire from the pending queue or a merchant's address
	// panel, so every mutation patches both lists by id.
	function patchLocationInLists(id: string, patch: Partial<AdminLocation>) {
		const apply = (l: AdminLocation) => (l.id === id ? { ...l, ...patch } : l);
		locations = locations.map(apply);
		merchantLocations = merchantLocations.map(apply);
	}

	function removeLocationFromLists(id: string) {
		locations = locations.filter((l) => l.id !== id);
		merchantLocations = merchantLocations.filter((l) => l.id !== id);
	}

	async function toggleMerchantAddresses(merchant: MerchantResponse) {
		if (expandedMerchantId === merchant.id) {
			expandedMerchantId = null;
			merchantLocations = [];
			return;
		}
		expandedMerchantId = merchant.id;
		merchantLocations = [];
		merchantLocationsLoading = true;
		errorMessage = null;
		try {
			// Omit `verified` to get every address of the merchant, not just the queue.
			const res = await listAdminLocations({ merchant: merchant.id, limit: 100 });
			merchantLocations = res.items;
		} catch (error) {
			showError(error);
		} finally {
			merchantLocationsLoading = false;
		}
	}

	async function handleVerifyLocation(location: AdminLocation) {
		if (pendingId) return;
		pendingId = location.id;
		errorMessage = null;
		try {
			const updated = await verifyLocation(location.id);
			// Leaves the pending queue, but stays (now verified) in the merchant panel.
			locations = locations.filter((l) => l.id !== location.id);
			merchantLocations = merchantLocations.map((l) =>
				l.id === location.id ? { ...l, ...updated, merchant: l.merchant } : l
			);
		} catch (error) {
			showError(error);
		} finally {
			pendingId = null;
		}
	}

	// --- Merge dialog ---
	let mergeOpen = $state(false);
	let mergeSource = $state<MerchantResponse | null>(null);
	let mergeTargetId = $state<string | undefined>(undefined);
	let mergeTargetName = $state('');
	let merging = $state(false);
	let canMerge = $derived(
		Boolean(mergeSource && mergeTargetId && mergeTargetId !== mergeSource.id)
	);

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
			dropMerchant(mergeSource.id);
			mergeOpen = false;
		} catch (error) {
			showError(error);
		} finally {
			merging = false;
		}
	}

	// --- Edit merchant dialog ---
	let editMerchantOpen = $state(false);
	let editMerchantTarget = $state<MerchantResponse | null>(null);
	let editMerchantName = $state('');
	let editMerchantSubmitting = $state(false);
	let editMerchantError = $state<string | null>(null);

	function openEditMerchant(merchant: MerchantResponse) {
		editMerchantTarget = merchant;
		editMerchantName = merchant.name;
		editMerchantError = null;
		editMerchantOpen = true;
	}

	async function confirmEditMerchant() {
		const name = editMerchantName.trim();
		if (!editMerchantTarget || !name || editMerchantSubmitting) return;
		editMerchantSubmitting = true;
		editMerchantError = null;
		try {
			const updated = await editMerchant(editMerchantTarget.id, { name });
			replaceMerchant(updated);
			editMerchantOpen = false;
		} catch (error) {
			editMerchantError =
				error instanceof ApiError && error.key === ErrorKey.MerchantNameTaken
					? $translationStore.errors['merchant.name_taken']
					: $translationStore.admin.actionError;
		} finally {
			editMerchantSubmitting = false;
		}
	}

	// --- Edit location dialog ---
	let editLocationOpen = $state(false);
	let editLocationTarget = $state<AdminLocation | null>(null);
	let editLocationAddress = $state('');
	let editLocationCity = $state('');
	let editLocationRegion = $state('');
	let editLocationSubmitting = $state(false);

	function openEditLocation(location: AdminLocation) {
		editLocationTarget = location;
		editLocationAddress = location.address;
		editLocationCity = location.city;
		editLocationRegion = location.region ?? '';
		editLocationOpen = true;
	}

	async function confirmEditLocation() {
		const address = editLocationAddress.trim();
		const city = editLocationCity.trim();
		if (!editLocationTarget || !address || !city || editLocationSubmitting) return;
		editLocationSubmitting = true;
		errorMessage = null;
		try {
			const updated = await editLocation(editLocationTarget.id, {
				address,
				city,
				region: editLocationRegion.trim() || undefined
			});
			patchLocationInLists(updated.id, updated);
			editLocationOpen = false;
		} catch (error) {
			showError(error);
			editLocationOpen = false;
		} finally {
			editLocationSubmitting = false;
		}
	}

	// --- Delete location dialog (with reassignment) ---
	let deleteOpen = $state(false);
	let deleteTarget = $state<AdminLocation | null>(null);
	let reassignOptions = $state<AdminLocation[]>([]);
	let reassignTargetId = $state('');
	let deleting = $state(false);
	let deleteInUse = $state(false);

	async function openDeleteLocation(location: AdminLocation) {
		deleteTarget = location;
		reassignTargetId = '';
		deleteInUse = false;
		deleteOpen = true;
		// Load the merchant's other addresses as possible reassignment targets.
		try {
			const res = await listAdminLocations({ merchant: location.merchant.id, limit: 100 });
			reassignOptions = res.items.filter((l) => l.id !== location.id);
		} catch {
			reassignOptions = [];
		}
	}

	async function confirmDeleteLocation() {
		if (!deleteTarget || deleting) return;
		deleting = true;
		errorMessage = null;
		try {
			await deleteLocation(deleteTarget.id, reassignTargetId || undefined);
			removeLocationFromLists(deleteTarget.id);
			deleteOpen = false;
		} catch (error) {
			if (error instanceof ApiError && error.key === ErrorKey.LocationInUse) {
				// Offers are attached: keep the dialog open and require a reassignment.
				deleteInUse = true;
			} else {
				showError(error);
				deleteOpen = false;
			}
		} finally {
			deleting = false;
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

			<div class="flex flex-wrap items-center gap-2">
				<div class="relative grow sm:max-w-xs">
					<SearchOutline
						class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
					/>
					<Input
						type="search"
						bind:value={merchantSearch}
						oninput={onSearchInput}
						placeholder={$translationStore.admin.searchPlaceholder}
						class="rounded-full border-gray-300 bg-white pl-9"
					/>
				</div>
				<div class="inline-flex rounded-full border border-gray-200 bg-white p-1">
					{#each [['pending', $translationStore.admin.filterPending], ['verified', $translationStore.admin.filterVerified], ['blocked', $translationStore.admin.filterBlocked], ['all', $translationStore.admin.filterAll]] as [value, label] (value)}
						<button
							type="button"
							onclick={() => setFilter(value as MerchantFilter)}
							aria-pressed={merchantFilter === value}
							class="rounded-full px-3 py-1 text-sm font-medium transition-colors {merchantFilter ===
							value
								? 'bg-primary-700 text-white shadow-sm'
								: 'text-gray-600 hover:text-primary-600'}"
						>
							{label}
						</button>
					{/each}
				</div>
			</div>

			{#if merchantsLoading}
				<div class="flex justify-center py-8"><Spinner size="6" /></div>
			{:else if merchants.length === 0}
				<p
					class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-500"
				>
					{$translationStore.admin.merchantsEmpty}
				</p>
			{:else}
				<div class="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
					<table class="w-full min-w-3xl text-left text-sm">
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
									<td class="px-4 py-3">
										<span class="flex flex-wrap items-center gap-2">
											<span class="font-medium text-gray-900">{merchant.name}</span>
											{#if merchant.verified}
												<span
													class="rounded-full bg-savings-50 px-2 py-0.5 text-xs font-medium text-savings-700"
												>
													{$translationStore.admin.statusVerified}
												</span>
											{/if}
											{#if merchant.blockedAt}
												<span
													class="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
												>
													{$translationStore.admin.statusBlocked}
												</span>
											{/if}
										</span>
									</td>
									<td class="px-4 py-3 text-gray-500">
										{dateFormatter.format(new Date(merchant.createdAt))}
									</td>
									<td class="px-4 py-3">
										<div class="flex flex-wrap justify-end gap-2">
											<Button
												size="xs"
												color="alternative"
												aria-expanded={expandedMerchantId === merchant.id}
												onclick={() => toggleMerchantAddresses(merchant)}
											>
												{expandedMerchantId === merchant.id
													? $translationStore.admin.hideAddresses
													: $translationStore.admin.viewAddresses}
											</Button>
											<Button
												size="xs"
												color="alternative"
												disabled={pendingId === merchant.id}
												onclick={() => openEditMerchant(merchant)}
											>
												{$translationStore.admin.actionEdit}
											</Button>
											<Button
												size="xs"
												color="alternative"
												disabled={pendingId === merchant.id}
												onclick={() => openMerge(merchant)}
											>
												{$translationStore.admin.actionMerge}
											</Button>
											{#if merchant.blockedAt}
												<Button
													size="xs"
													color="alternative"
													disabled={pendingId === merchant.id}
													onclick={() => handleUnblockMerchant(merchant)}
												>
													{$translationStore.admin.actionUnblock}
												</Button>
											{:else}
												<Button
													size="xs"
													color="red"
													outline
													disabled={pendingId === merchant.id}
													onclick={() => handleBlockMerchant(merchant)}
												>
													{$translationStore.admin.actionBlock}
												</Button>
											{/if}
											{#if !merchant.verified}
												<Button
													size="xs"
													disabled={pendingId === merchant.id}
													onclick={() => handleVerifyMerchant(merchant)}
												>
													<span class="flex items-center gap-1">
														<CheckCircleOutline class="h-4 w-4" />
														{$translationStore.admin.actionVerify}
													</span>
												</Button>
											{/if}
										</div>
									</td>
								</tr>
								{#if expandedMerchantId === merchant.id}
									<tr class="bg-gray-50/60">
										<td colspan="3" class="px-4 py-3">
											{#if merchantLocationsLoading}
												<div class="flex justify-center py-4"><Spinner size="5" /></div>
											{:else if merchantLocations.length === 0}
												<p class="py-2 text-center text-sm text-gray-500">
													{$translationStore.admin.merchantAddressesEmpty}
												</p>
											{:else}
												<div class="space-y-2">
													{#each merchantLocations as loc (loc.id)}
														<div class="rounded-xl border border-gray-100 bg-white px-3 py-2">
															<div class="flex flex-wrap items-center justify-between gap-2">
																<div class="flex flex-wrap items-center gap-2">
																	<span class="font-medium text-gray-900">{loc.address}</span>
																	<span class="text-xs text-gray-500">{loc.city}</span>
																	{#if loc.verified}
																		<span
																			class="rounded-full bg-savings-50 px-2 py-0.5 text-xs font-medium text-savings-700"
																		>
																			{$translationStore.admin.statusVerified}
																		</span>
																	{/if}
																</div>
																<div class="flex flex-wrap gap-2">
																	{#if loc.latitude != null && loc.longitude != null}
																		<Button
																			size="xs"
																			color="alternative"
																			onclick={() => toggleMap(loc.id)}
																		>
																			{expandedLocationId === loc.id
																				? $translationStore.admin.hideMap
																				: $translationStore.admin.viewMap}
																		</Button>
																	{/if}
																	<Button
																		size="xs"
																		color="alternative"
																		disabled={pendingId === loc.id}
																		onclick={() => openEditLocation(loc)}
																	>
																		{$translationStore.admin.actionEdit}
																	</Button>
																	<Button
																		size="xs"
																		color="red"
																		outline
																		disabled={pendingId === loc.id}
																		onclick={() => openDeleteLocation(loc)}
																	>
																		{$translationStore.admin.actionDelete}
																	</Button>
																	{#if !loc.verified}
																		<Button
																			size="xs"
																			disabled={pendingId === loc.id}
																			onclick={() => handleVerifyLocation(loc)}
																		>
																			<span class="flex items-center gap-1">
																				<CheckCircleOutline class="h-4 w-4" />
																				{$translationStore.admin.actionVerify}
																			</span>
																		</Button>
																	{/if}
																</div>
															</div>
															{#if expandedLocationId === loc.id && loc.latitude != null && loc.longitude != null}
																<div class="pt-3">
																	<LocationMap latitude={loc.latitude} longitude={loc.longitude} />
																</div>
															{/if}
														</div>
													{/each}
												</div>
											{/if}
										</td>
									</tr>
								{/if}
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
										<span class="block text-xs text-gray-500">{location.city}</span>
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
												color="alternative"
												disabled={pendingId === location.id}
												onclick={() => openEditLocation(location)}
											>
												{$translationStore.admin.actionEdit}
											</Button>
											<Button
												size="xs"
												color="red"
												outline
												disabled={pendingId === location.id}
												onclick={() => openDeleteLocation(location)}
											>
												{$translationStore.admin.actionDelete}
											</Button>
											<Button
												size="xs"
												disabled={pendingId === location.id}
												onclick={() => handleVerifyLocation(location)}
											>
												<span class="flex items-center gap-1">
													<CheckCircleOutline class="h-4 w-4" />
													{$translationStore.admin.actionVerify}
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

<!-- Merge -->
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
				{$translationStore.admin.cancel}
			</Button>
			<Button color="red" disabled={!canMerge || merging} onclick={confirmMerge}>
				{merging ? $translationStore.admin.mergeSubmitting : $translationStore.admin.mergeConfirm}
			</Button>
		</div>
	{/snippet}
</Modal>

<!-- Edit merchant -->
<Modal bind:open={editMerchantOpen} title={$translationStore.admin.editMerchantTitle} size="sm">
	<div class="space-y-2">
		<label for="editMerchantName" class="text-sm font-medium text-gray-700">
			{$translationStore.admin.merchantNameLabel}
		</label>
		<Input id="editMerchantName" type="text" bind:value={editMerchantName} maxlength={100} />
		{#if editMerchantError}
			<p class="text-sm text-red-600">{editMerchantError}</p>
		{/if}
	</div>
	{#snippet footer()}
		<div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
			<Button
				color="alternative"
				disabled={editMerchantSubmitting}
				onclick={() => (editMerchantOpen = false)}
			>
				{$translationStore.admin.cancel}
			</Button>
			<Button
				disabled={!editMerchantName.trim() || editMerchantSubmitting}
				onclick={confirmEditMerchant}
			>
				{editMerchantSubmitting ? $translationStore.admin.saving : $translationStore.admin.save}
			</Button>
		</div>
	{/snippet}
</Modal>

<!-- Edit location -->
<Modal bind:open={editLocationOpen} title={$translationStore.admin.editLocationTitle} size="md">
	<div class="space-y-4">
		<div class="space-y-2">
			<label for="editLocAddress" class="text-sm font-medium text-gray-700">
				{$translationStore.admin.thAddress}
			</label>
			<Input id="editLocAddress" type="text" bind:value={editLocationAddress} maxlength={255} />
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="space-y-2">
				<label for="editLocCity" class="text-sm font-medium text-gray-700">
					{$translationStore.createDeal.cityLabel}
				</label>
				<Input id="editLocCity" type="text" bind:value={editLocationCity} maxlength={100} />
			</div>
			<div class="space-y-2">
				<label for="editLocRegion" class="text-sm font-medium text-gray-700">
					{$translationStore.admin.regionLabel}
				</label>
				<Input id="editLocRegion" type="text" bind:value={editLocationRegion} maxlength={100} />
			</div>
		</div>
	</div>
	{#snippet footer()}
		<div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
			<Button
				color="alternative"
				disabled={editLocationSubmitting}
				onclick={() => (editLocationOpen = false)}
			>
				{$translationStore.admin.cancel}
			</Button>
			<Button
				disabled={!editLocationAddress.trim() || !editLocationCity.trim() || editLocationSubmitting}
				onclick={confirmEditLocation}
			>
				{editLocationSubmitting ? $translationStore.admin.saving : $translationStore.admin.save}
			</Button>
		</div>
	{/snippet}
</Modal>

<!-- Delete location -->
<Modal bind:open={deleteOpen} title={$translationStore.admin.deleteLocationTitle} size="md">
	<div class="space-y-4">
		<p class="text-sm leading-6 text-gray-600">
			{$translationStore.admin.deleteLocationDesc.replace('{address}', deleteTarget?.address ?? '')}
		</p>
		{#if deleteInUse}
			<p class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
				{$translationStore.admin.reassignHint}
			</p>
		{/if}
		{#if reassignOptions.length > 0}
			<div class="space-y-2">
				<label for="reassignTarget" class="text-sm font-medium text-gray-700">
					{$translationStore.admin.reassignLabel}
				</label>
				<Select id="reassignTarget" bind:value={reassignTargetId} placeholder="">
					<option value="">{$translationStore.admin.reassignNone}</option>
					{#each reassignOptions as option (option.id)}
						<option value={option.id}>{option.address} · {option.city}</option>
					{/each}
				</Select>
			</div>
		{/if}
	</div>
	{#snippet footer()}
		<div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
			<Button color="alternative" disabled={deleting} onclick={() => (deleteOpen = false)}>
				{$translationStore.admin.cancel}
			</Button>
			<Button
				color="red"
				disabled={deleting || (deleteInUse && !reassignTargetId)}
				onclick={confirmDeleteLocation}
			>
				{deleting ? $translationStore.admin.deleting : $translationStore.admin.actionDelete}
			</Button>
		</div>
	{/snippet}
</Modal>
