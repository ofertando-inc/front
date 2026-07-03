<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Input, Modal, Select, Spinner } from 'flowbite-svelte';
	import { PlusOutline, SearchOutline } from 'flowbite-svelte-icons';
	import { createAccount, createClaim, listAccounts, updateAccount } from '$lib/api/admin';
	import { ApiError } from '$lib/api/client';
	import MerchantCombobox from '$lib/components/offers/MerchantCombobox.svelte';
	import { localeStore, translationStore } from '$lib/i18n';
	import { resolveOfferError } from '$lib/offers/offerErrors';
	import type { AdminAccountsQuery, PublicUser } from '$lib/types/admin';
	import { ACCOUNT_TYPES, USER_ROLES } from '$lib/types/auth';
	import type { AccountType, UserRole } from '$lib/types/auth';

	let accounts = $state<PublicUser[]>([]);
	let cursor = $state<string | null>(null);
	let loading = $state(true);
	let listLoading = $state(false);
	let loadingMore = $state(false);
	let pendingId = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);

	let search = $state('');
	let roleFilter = $state<'' | UserRole>('');
	let typeFilter = $state<'' | AccountType>('');
	let searchDebounce: ReturnType<typeof setTimeout> | undefined;

	let dateFormatter = $derived(
		new Intl.DateTimeFormat($localeStore, { day: 'numeric', month: 'short', year: 'numeric' })
	);

	function accountsQuery(): AdminAccountsQuery {
		return {
			q: search.trim() || undefined,
			role: roleFilter || undefined,
			accountType: typeFilter || undefined
		};
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

	function resolveDialogError(error: unknown): string {
		if (error instanceof ApiError) {
			const key = error.key;
			if (key && key in $translationStore.errors) {
				return $translationStore.errors[key as keyof typeof $translationStore.errors];
			}
		}
		return $translationStore.admin.actionError;
	}

	onMount(() => void load());

	async function load() {
		loading = true;
		errorMessage = null;
		try {
			const res = await listAccounts({ ...accountsQuery(), limit: 20 });
			accounts = res.items;
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
			const res = await listAccounts({ ...accountsQuery(), limit: 20 });
			accounts = res.items;
			cursor = res.nextCursor;
		} catch (error) {
			showError(error);
		} finally {
			listLoading = false;
		}
	}

	function onSearchInput() {
		clearTimeout(searchDebounce);
		searchDebounce = setTimeout(() => void reload(), 300);
	}

	async function loadMore() {
		if (!cursor || loadingMore) return;
		loadingMore = true;
		try {
			const res = await listAccounts({ ...accountsQuery(), limit: 20, cursor });
			accounts = [...accounts, ...res.items];
			cursor = res.nextCursor;
		} catch (error) {
			showError(error);
		} finally {
			loadingMore = false;
		}
	}

	function replaceAccount(updated: PublicUser) {
		accounts = accounts.map((a) => (a.id === updated.id ? updated : a));
	}

	async function toggleStatus(account: PublicUser) {
		if (pendingId) return;
		pendingId = account.id;
		errorMessage = null;
		try {
			const updated = await updateAccount(account.id, {
				status: account.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
			});
			replaceAccount(updated);
		} catch (error) {
			showError(error);
		} finally {
			pendingId = null;
		}
	}

	// --- Create dialog ---
	let createOpen = $state(false);
	let createEmail = $state('');
	let createUsername = $state('');
	let createPassword = $state('');
	let createRole = $state<UserRole>('USER');
	let createType = $state<AccountType>('INDIVIDUAL');
	let createMerchantName = $state('');
	let createMerchantId = $state<string | undefined>(undefined);
	let createSubmitting = $state(false);
	let createError = $state<string | null>(null);
	let canCreate = $derived(
		Boolean(createEmail.trim() && createUsername.trim() && createPassword.trim().length >= 8)
	);

	function openCreate() {
		createEmail = '';
		createUsername = '';
		createPassword = '';
		createRole = 'USER';
		createType = 'INDIVIDUAL';
		createMerchantName = '';
		createMerchantId = undefined;
		createError = null;
		createOpen = true;
	}

	async function confirmCreate() {
		if (!canCreate || createSubmitting) return;
		createSubmitting = true;
		createError = null;
		try {
			const created = await createAccount({
				email: createEmail.trim(),
				username: createUsername.trim(),
				password: createPassword,
				accountType: createType,
				role: createRole
			});
			// Optional affiliation for business accounts: the ROOT-created claim is
			// approved on the spot, so the merchant gets its owner immediately.
			if (createType === 'BUSINESS' && createMerchantId) {
				try {
					await createClaim({ userId: created.id, merchantId: createMerchantId });
				} catch (claimError) {
					// The account exists; surface why the affiliation part failed.
					errorMessage = resolveDialogError(claimError);
				}
			}
			createOpen = false;
			await reload();
		} catch (error) {
			createError = resolveDialogError(error);
		} finally {
			createSubmitting = false;
		}
	}

	// --- Edit dialog ---
	let editOpen = $state(false);
	let editTarget = $state<PublicUser | null>(null);
	let editEmail = $state('');
	let editUsername = $state('');
	let editPassword = $state('');
	let editRole = $state<UserRole>('USER');
	let editType = $state<AccountType>('INDIVIDUAL');
	let editSubmitting = $state(false);
	let editError = $state<string | null>(null);

	function openEdit(account: PublicUser) {
		editTarget = account;
		editEmail = account.email;
		editUsername = account.username;
		editPassword = '';
		editRole = account.role;
		editType = account.accountType;
		editError = null;
		editOpen = true;
	}

	async function confirmEdit() {
		if (!editTarget || editSubmitting) return;
		const email = editEmail.trim();
		const username = editUsername.trim();
		if (!email || !username) return;
		editSubmitting = true;
		editError = null;
		try {
			const updated = await updateAccount(editTarget.id, {
				email,
				username,
				role: editRole,
				accountType: editType,
				...(editPassword.trim() ? { password: editPassword } : {})
			});
			replaceAccount(updated);
			editOpen = false;
		} catch (error) {
			editError = resolveDialogError(error);
		} finally {
			editSubmitting = false;
		}
	}
</script>

<div class="space-y-4">
	<p class="text-sm text-gray-500">{$translationStore.admin.accountsSubtitle}</p>

	{#if errorMessage}
		<p
			role="alert"
			class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
		>
			{errorMessage}
		</p>
	{/if}

	<div class="flex flex-wrap items-center gap-2">
		<div class="relative grow sm:max-w-xs">
			<SearchOutline
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
			/>
			<Input
				type="search"
				bind:value={search}
				oninput={onSearchInput}
				placeholder={$translationStore.admin.searchAccountsPlaceholder}
				class="rounded-full border-gray-300 bg-white pl-9"
			/>
		</div>
		<Select
			bind:value={roleFilter}
			onchange={() => void reload()}
			class="w-auto rounded-full border-gray-300 bg-white text-sm"
			placeholder=""
			aria-label={$translationStore.admin.thRole}
		>
			<option value="">{$translationStore.admin.filterAllRoles}</option>
			{#each USER_ROLES as role (role)}
				<option value={role}>{role}</option>
			{/each}
		</Select>
		<Select
			bind:value={typeFilter}
			onchange={() => void reload()}
			class="w-auto rounded-full border-gray-300 bg-white text-sm"
			placeholder=""
			aria-label={$translationStore.admin.thType}
		>
			<option value="">{$translationStore.admin.filterAllTypes}</option>
			{#each ACCOUNT_TYPES as type (type)}
				<option value={type}>
					{type === 'BUSINESS'
						? $translationStore.admin.accountTypeBusiness
						: $translationStore.admin.accountTypeIndividual}
				</option>
			{/each}
		</Select>
		<Button class="ml-auto" size="sm" onclick={openCreate}>
			<span class="flex items-center gap-1">
				<PlusOutline class="h-4 w-4" />
				{$translationStore.admin.createAccount}
			</span>
		</Button>
	</div>

	{#if loading || listLoading}
		<div class="flex justify-center py-12"><Spinner /></div>
	{:else if accounts.length === 0}
		<p class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-500">
			{$translationStore.admin.accountsEmpty}
		</p>
	{:else}
		<div class="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
			<table class="w-full min-w-3xl text-left text-sm">
				<thead class="bg-gray-50 text-xs tracking-wide text-gray-500 uppercase">
					<tr>
						<th class="px-4 py-3">{$translationStore.admin.thAccount}</th>
						<th class="px-4 py-3">{$translationStore.admin.thRole}</th>
						<th class="px-4 py-3">{$translationStore.admin.thType}</th>
						<th class="px-4 py-3">{$translationStore.admin.thCreated}</th>
						<th class="px-4 py-3 text-right">{$translationStore.admin.thActions}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each accounts as account (account.id)}
						<tr class="transition-colors hover:bg-gray-50">
							<td class="px-4 py-3">
								<span class="flex flex-wrap items-center gap-2">
									<span class="font-medium text-gray-900">{account.username}</span>
									{#if account.status === 'DISABLED'}
										<span
											class="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
										>
											{$translationStore.admin.statusDisabled}
										</span>
									{/if}
								</span>
								<span class="block text-xs text-gray-500">{account.email}</span>
							</td>
							<td class="px-4 py-3">
								<span
									class="rounded-full px-2 py-0.5 text-xs font-medium {account.role === 'ROOT'
										? 'bg-purple-50 text-purple-700'
										: account.role === 'ADMIN'
											? 'bg-sky-50 text-sky-700'
											: 'bg-gray-100 text-gray-600'}"
								>
									{account.role}
								</span>
							</td>
							<td class="px-4 py-3">
								<span
									class="rounded-full px-2 py-0.5 text-xs font-medium {account.accountType ===
									'BUSINESS'
										? 'bg-orange-50 text-primary-700'
										: 'bg-gray-100 text-gray-600'}"
								>
									{account.accountType === 'BUSINESS'
										? $translationStore.admin.accountTypeBusiness
										: $translationStore.admin.accountTypeIndividual}
								</span>
							</td>
							<td class="px-4 py-3 text-gray-500">
								{dateFormatter.format(new Date(account.createdAt))}
							</td>
							<td class="px-4 py-3">
								<div class="flex flex-wrap justify-end gap-2">
									<Button
										size="xs"
										color="alternative"
										disabled={pendingId === account.id}
										onclick={() => openEdit(account)}
									>
										{$translationStore.admin.actionEdit}
									</Button>
									{#if account.status === 'ACTIVE'}
										<Button
											size="xs"
											color="red"
											outline
											disabled={pendingId === account.id}
											onclick={() => toggleStatus(account)}
										>
											{$translationStore.admin.actionDisable}
										</Button>
									{:else}
										<Button
											size="xs"
											disabled={pendingId === account.id}
											onclick={() => toggleStatus(account)}
										>
											{$translationStore.admin.actionRestore}
										</Button>
									{/if}
								</div>
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

<!-- Create account -->
<Modal bind:open={createOpen} title={$translationStore.admin.createAccount} size="md">
	<div class="space-y-4">
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="space-y-2">
				<label for="createEmail" class="text-sm font-medium text-gray-700">
					{$translationStore.admin.emailLabel}
				</label>
				<Input id="createEmail" type="email" bind:value={createEmail} maxlength={255} />
			</div>
			<div class="space-y-2">
				<label for="createUsername" class="text-sm font-medium text-gray-700">
					{$translationStore.admin.usernameLabel}
				</label>
				<Input id="createUsername" type="text" bind:value={createUsername} maxlength={100} />
			</div>
		</div>
		<div class="space-y-2">
			<label for="createPassword" class="text-sm font-medium text-gray-700">
				{$translationStore.admin.passwordLabel}
			</label>
			<Input id="createPassword" type="text" bind:value={createPassword} maxlength={100} />
			<p class="text-xs text-gray-500">{$translationStore.admin.passwordHint}</p>
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="space-y-2">
				<label for="createRole" class="text-sm font-medium text-gray-700">
					{$translationStore.admin.thRole}
				</label>
				<Select id="createRole" bind:value={createRole} placeholder="">
					{#each USER_ROLES as role (role)}
						<option value={role}>{role}</option>
					{/each}
				</Select>
			</div>
			<div class="space-y-2">
				<label for="createType" class="text-sm font-medium text-gray-700">
					{$translationStore.admin.thType}
				</label>
				<Select id="createType" bind:value={createType} placeholder="">
					{#each ACCOUNT_TYPES as type (type)}
						<option value={type}>
							{type === 'BUSINESS'
								? $translationStore.admin.accountTypeBusiness
								: $translationStore.admin.accountTypeIndividual}
						</option>
					{/each}
				</Select>
			</div>
		</div>
		{#if createType === 'BUSINESS'}
			<div class="space-y-2">
				<label for="createMerchant" class="text-sm font-medium text-gray-700">
					{$translationStore.admin.affiliateMerchantLabel}
				</label>
				<MerchantCombobox
					id="createMerchant"
					bind:merchantName={createMerchantName}
					bind:merchantId={createMerchantId}
					placeholder={$translationStore.admin.affiliateMerchantPlaceholder}
				/>
				<p class="text-xs text-gray-500">{$translationStore.admin.affiliateMerchantHint}</p>
			</div>
		{/if}
		{#if createError}
			<p class="text-sm text-red-600">{createError}</p>
		{/if}
	</div>
	{#snippet footer()}
		<div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
			<Button color="alternative" disabled={createSubmitting} onclick={() => (createOpen = false)}>
				{$translationStore.admin.cancel}
			</Button>
			<Button disabled={!canCreate || createSubmitting} onclick={confirmCreate}>
				{createSubmitting ? $translationStore.admin.saving : $translationStore.admin.createAccount}
			</Button>
		</div>
	{/snippet}
</Modal>

<!-- Edit account -->
<Modal bind:open={editOpen} title={$translationStore.admin.editAccountTitle} size="md">
	<div class="space-y-4">
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="space-y-2">
				<label for="editEmail" class="text-sm font-medium text-gray-700">
					{$translationStore.admin.emailLabel}
				</label>
				<Input id="editEmail" type="email" bind:value={editEmail} maxlength={255} />
			</div>
			<div class="space-y-2">
				<label for="editUsername" class="text-sm font-medium text-gray-700">
					{$translationStore.admin.usernameLabel}
				</label>
				<Input id="editUsername" type="text" bind:value={editUsername} maxlength={100} />
			</div>
		</div>
		<div class="space-y-2">
			<label for="editPassword" class="text-sm font-medium text-gray-700">
				{$translationStore.admin.newPasswordLabel}
			</label>
			<Input id="editPassword" type="text" bind:value={editPassword} maxlength={100} />
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="space-y-2">
				<label for="editRole" class="text-sm font-medium text-gray-700">
					{$translationStore.admin.thRole}
				</label>
				<Select id="editRole" bind:value={editRole} placeholder="">
					{#each USER_ROLES as role (role)}
						<option value={role}>{role}</option>
					{/each}
				</Select>
			</div>
			<div class="space-y-2">
				<label for="editType" class="text-sm font-medium text-gray-700">
					{$translationStore.admin.thType}
				</label>
				<Select id="editType" bind:value={editType} placeholder="">
					{#each ACCOUNT_TYPES as type (type)}
						<option value={type}>
							{type === 'BUSINESS'
								? $translationStore.admin.accountTypeBusiness
								: $translationStore.admin.accountTypeIndividual}
						</option>
					{/each}
				</Select>
			</div>
		</div>
		{#if editError}
			<p class="text-sm text-red-600">{editError}</p>
		{/if}
	</div>
	{#snippet footer()}
		<div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
			<Button color="alternative" disabled={editSubmitting} onclick={() => (editOpen = false)}>
				{$translationStore.admin.cancel}
			</Button>
			<Button
				disabled={!editEmail.trim() || !editUsername.trim() || editSubmitting}
				onclick={confirmEdit}
			>
				{editSubmitting ? $translationStore.admin.saving : $translationStore.admin.save}
			</Button>
		</div>
	{/snippet}
</Modal>
