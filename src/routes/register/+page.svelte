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
		username: '',
		password: ''
	});
	let registerError = $state<unknown>(null);
	let loading = $state(false);

	let resolvedError = $derived(
		registerError ? resolveAuthError(registerError, $translationStore, 'register') : null
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
		registerError = null;
		loading = true;

		try {
			await authStore.register(values.email, values.username, values.password);
			await goto(resolveRoute('/profile'));
		} catch (err) {
			registerError = err;
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{$translationStore.auth.registerTitle}</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-9rem)] items-center justify-center py-8 sm:py-12">
	<Card class="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
		<AuthForm
			title={$translationStore.auth.registerTitle}
			description={$translationStore.auth.registerDescription}
			submitLabel={$translationStore.auth.submitRegister}
			fields={[
				{
					name: 'email',
					label: $translationStore.auth.email,
					type: 'email',
					placeholder: 'mail@example.com'
				},
				{
					name: 'username',
					label: $translationStore.auth.username,
					type: 'text',
					placeholder: 'user'
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
				<span>{$translationStore.auth.alreadyHaveAccount}</span>
				<a
					href={resolveRoute('/login')}
					class="ml-1 font-medium text-primary-600 hover:text-primary-500"
				>
					{$translationStore.auth.loginHere}
				</a>
			{/snippet}
		</AuthForm>
	</Card>
</div>
