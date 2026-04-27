<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Card } from 'flowbite-svelte';
	import { authStore } from '$lib/stores/auth';
	import { translationStore } from '$lib/i18n';

	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		if (!browser) return;

		if (!$authStore.accessToken) {
			await goto('/login');
			return;
		}

		try {
			await authStore.loadCurrentUser();
		} catch (err) {
			error = err instanceof Error ? err.message : $translationStore.auth.sessionExpired;
			await goto('/login');
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
	<div class="rounded-[2rem] bg-white p-10 text-center shadow-lg shadow-orange-100/60">
		{$translationStore.common.loading}
	</div>
{:else if $authStore.user}
	<section class="space-y-8">
		<div class="rounded-[2rem] bg-white p-8 shadow-xl shadow-orange-100/60">
			<p class="text-sm uppercase tracking-[0.2em] text-orange-500">Profile</p>
			<h1 class="mt-3 text-4xl font-semibold text-slate-900">{$translationStore.auth.profileTitle}</h1>
			<p class="mt-3 text-sm text-slate-600">{$translationStore.auth.profileDescription}</p>
			{#if error}
				<p class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
			{/if}
		</div>

		<div class="grid gap-6 lg:grid-cols-3">
			<Card class="border-0 shadow-lg shadow-orange-100/60">
				<p class="text-sm text-slate-500">Email</p>
				<p class="mt-2 text-lg font-medium text-slate-900">{$authStore.user.email}</p>
			</Card>
			<Card class="border-0 shadow-lg shadow-orange-100/60">
				<p class="text-sm text-slate-500">Username</p>
				<p class="mt-2 text-lg font-medium text-slate-900">{$authStore.user.username}</p>
			</Card>
			<Card class="border-0 shadow-lg shadow-orange-100/60">
				<p class="text-sm text-slate-500">Role</p>
				<p class="mt-2 text-lg font-medium text-slate-900">{$authStore.user.role}</p>
			</Card>
		</div>
	</section>
{/if}
