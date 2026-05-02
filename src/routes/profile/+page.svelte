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
	let error = $state<string | null>(null);
	let selectedTab = $state('offers');

	let memberDate = $derived(
		$authStore.user
			? new Intl.DateTimeFormat($localeStore, {
					month: 'short',
					year: 'numeric'
				}).format(new Date($authStore.user.createdAt))
			: ''
	);

	onMount(async () => {
		if (!browser) return;

		if (!$authStore.accessToken) {
			await goto(resolveRoute('/login'));
			return;
		}

		try {
			await authStore.loadCurrentUser();
		} catch (err) {
			error = err instanceof Error ? err.message : $translationStore.auth.sessionExpired;
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
	<Card class="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
		{$translationStore.common.loading}
	</Card>
{:else if $authStore.user}
	<section class="mx-auto max-w-7xl space-y-8 py-4 sm:py-8">
		<Card class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
			{#if error}
				<p class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</p>
			{/if}

			<div class="flex flex-col items-center gap-6 md:flex-row md:items-start">
				<Avatar
					size="xl"
					cornerStyle="circular"
					class="bg-primary-100 text-primary-600 ring-4 ring-primary-50"
				/>

				<div class="flex-1 text-center md:text-left">
					<h1 class="text-3xl font-bold text-gray-900">{$authStore.user.username}</h1>
					<p class="mt-1 break-all text-gray-500">
						@{$authStore.user.username} · {$translationStore.profile.memberSince}
						{memberDate}
					</p>
					<p class="mt-1 text-sm break-all text-gray-500">{$authStore.user.email}</p>

					<div class="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
						<span
							class="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-green-200"
						>
							{$translationStore.profile.status}: {$authStore.user.status}
						</span>
						<span
							class="rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200"
						>
							{$translationStore.profile.role}: {$authStore.user.role}
						</span>
					</div>

					<div class="mt-6 flex flex-wrap justify-center gap-6 md:justify-start">
						<div class="text-center">
							<span class="block text-2xl font-bold text-gray-900">0</span>
							<span class="text-sm text-gray-500">{$translationStore.profile.offers}</span>
						</div>
						<div class="text-center">
							<span class="block text-2xl font-bold text-gray-900">0</span>
							<span class="text-sm text-gray-500">{$translationStore.profile.comments}</span>
						</div>
						<div class="text-center">
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
				contentClass="pt-6"
			>
				<TabItem key="offers" open>
					{#snippet titleSlot()}
						<span class="flex items-center gap-2 whitespace-nowrap">
							<TagSolid class="h-4 w-4" />
							{$translationStore.profile.myOffers}
						</span>
					{/snippet}

					<Card class="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center shadow-none">
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

					<Card class="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center shadow-none">
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

					<Card class="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center shadow-none">
						<p class="font-medium text-gray-700">{$translationStore.profile.noVotes}</p>
						<p class="mt-2 text-sm text-gray-500">{$translationStore.profile.comingSoon}</p>
					</Card>
				</TabItem>
			</Tabs>
		</div>
	</section>
{/if}
