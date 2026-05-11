<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolveRoute } from '$app/paths';
	import { onMount } from 'svelte';
	import { Card } from 'flowbite-svelte';
	import { TagSolid } from 'flowbite-svelte-icons';
	import AuthForm from '$lib/components/auth/AuthForm.svelte';
	import { resolveAuthError } from '$lib/auth/authErrors';
	import { authStore } from '$lib/stores/auth';
	import { translationStore } from '$lib/i18n';

	let values = $state({
		email: '',
		password: ''
	});
	let loginError = $state<unknown>(null);
	let loading = $state(false);

	let resolvedError = $derived(
		loginError ? resolveAuthError(loginError, $translationStore, 'login') : null
	);
	let bannerMessage = $derived(resolvedError?.bannerMessage ?? null);
	let fieldErrors = $derived(resolvedError?.fieldErrors ?? {});

	onMount(async () => {
		if (!$authStore.accessToken) return;

		try {
			await authStore.loadCurrentUser();
			await goto(resolveRoute('/profile'));
		} catch {
			// Invalid stored sessions are cleared by the auth store.
		}
	});

	async function handleSubmit() {
		loginError = null;
		loading = true;

		try {
			await authStore.login(values.email, values.password);
			await goto(resolveRoute('/profile'));
		} catch (err) {
			loginError = err;
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{$translationStore.auth.loginTitle}</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-9rem)] items-center justify-center py-8 sm:py-12">
	<Card class="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
		<AuthForm
			title={$translationStore.auth.loginTitle}
			description={$translationStore.auth.loginDescription}
			submitLabel={$translationStore.auth.submitLogin}
			fields={[
				{
					name: 'email',
					label: $translationStore.auth.email,
					type: 'email',
					placeholder: 'mail@example.com'
				},
				{
					name: 'password',
					label: $translationStore.auth.password,
					type: 'password',
					placeholder: '••••••••'
				}
			]}
			{values}
			error={bannerMessage}
			{fieldErrors}
			{loading}
			centered
			onSubmit={handleSubmit}
		>
			{#snippet top()}
				<div
					class="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-white"
				>
					<TagSolid class="h-7 w-7 -rotate-90" />
				</div>
			{/snippet}

			{#snippet alternate()}
				<span>{$translationStore.auth.noAccount}</span>
				<a
					href={resolveRoute('/register')}
					class="ml-1 font-medium text-primary-600 hover:text-primary-500"
				>
					{$translationStore.auth.registerHere}
				</a>
			{/snippet}
		</AuthForm>
	</Card>
</div>
