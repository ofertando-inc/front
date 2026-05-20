<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolveRoute } from '$app/paths';
	import { onMount } from 'svelte';
	import { Avatar, Card, TabItem, Tabs } from 'flowbite-svelte';
	import { FireSolid, MessageDotsOutline, TagSolid } from 'flowbite-svelte-icons';
	import { authStore } from '$lib/stores/auth';
	import { localeStore, translationStore } from '$lib/i18n';

	let loading = $state(true);
	let selectedTab = $state('offers');

	let memberDate = $derived(
		$authStore.user
			? new Intl.DateTimeFormat($localeStore, {
					month: 'long',
					year: 'numeric'
				}).format(new Date($authStore.user.createdAt))
			: ''
	);

	onMount(async () => {
		if (!browser) return;

		// With cookie-based sessions we can't peek the auth state without a
		// round-trip. Try to load the current user — if the cookies are missing
		// or expired (and the refresh also fails), redirect to login.
		try {
			await authStore.loadCurrentUser();
		} catch {
			await goto(resolveRoute('/login'));
			return;
		} finally {
			loading = false;
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
						class="mx-auto mt-6 grid w-full max-w-md grid-cols-3 gap-3 sm:gap-6 md:mx-0 md:max-w-lg"
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
						class="mx-auto mt-6 grid w-full max-w-md grid-cols-3 gap-3 sm:gap-6 md:mx-0 md:max-w-lg"
					>
						<div class="rounded-xl bg-gray-50 px-3 py-3 text-center">
							<span class="block text-2xl font-bold text-gray-900">0</span>
							<span class="text-sm text-gray-500">{$translationStore.profile.offers}</span>
						</div>
						<div class="rounded-xl bg-gray-50 px-3 py-3 text-center">
							<span class="block text-2xl font-bold text-gray-900">0</span>
							<span class="text-sm text-gray-500">{$translationStore.profile.comments}</span>
						</div>
						<div class="rounded-xl bg-primary-50 px-3 py-3 text-center">
							<span class="block text-2xl font-bold text-primary-600">0°</span>
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
				classes={{ content: 'pt-6' }}
			>
				<TabItem key="offers" open>
					{#snippet titleSlot()}
						<span class="flex items-center gap-2 whitespace-nowrap">
							<TagSolid class="h-4 w-4" />
							{$translationStore.profile.myOffers}
						</span>
					{/snippet}

					<Card
						size="xl"
						class="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center shadow-none"
					>
						<p class="font-medium text-gray-700">{$translationStore.profile.noOffers}</p>
						<p class="mt-2 text-sm text-gray-500">{$translationStore.profile.comingSoon}</p>
					</Card>
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
