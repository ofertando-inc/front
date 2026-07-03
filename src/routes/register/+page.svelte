<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolveRoute } from '$app/paths';
	import { onDestroy } from 'svelte';
	import { Card } from 'flowbite-svelte';
	import { TagSolid } from 'flowbite-svelte-icons';
	import AuthForm from '$lib/components/auth/AuthForm.svelte';
	import { ApiError } from '$lib/api/client';
	import {
		DEFAULT_RATE_LIMIT_COOLDOWN_SECONDS,
		formatRateLimitedMessage,
		resolveAuthError
	} from '$lib/auth/authErrors';
	import { createCooldown } from '$lib/auth/cooldown.svelte';
	import { ErrorKey } from '$lib/errors/errorKeys';
	import { authStore } from '$lib/stores/auth';
	import { translationStore } from '$lib/i18n';

	let values = $state({
		email: '',
		username: '',
		password: '',
		confirmPassword: ''
	});
	let registerError = $state<unknown>(null);
	let clientFieldErrors = $state<Record<string, string>>({});
	let loading = $state(false);
	const cooldown = createCooldown();

	let resolvedError = $derived(
		registerError ? resolveAuthError(registerError, $translationStore, 'register') : null
	);
	let bannerMessage = $derived(
		cooldown.active
			? formatRateLimitedMessage(cooldown.seconds, $translationStore)
			: (resolvedError?.bannerMessage ?? null)
	);
	let fieldErrors = $derived({
		...(resolvedError?.fieldErrors ?? {}),
		...clientFieldErrors
	});

	$effect(() => {
		if ($authStore.user) {
			void goto(resolveRoute('/profile'));
		}
	});

	onDestroy(() => cooldown.stop());

	async function handleSubmit() {
		if (cooldown.active) return;

		registerError = null;
		clientFieldErrors = {};

		if (values.password !== values.confirmPassword) {
			clientFieldErrors = { confirmPassword: $translationStore.auth.passwordMismatch };
			return;
		}

		loading = true;

		try {
			await authStore.register(values.email, values.username, values.password);
			await goto(resolveRoute('/profile'));
		} catch (err) {
			registerError = err;
			if (err instanceof ApiError && err.key === ErrorKey.ErrorTooManyRequests) {
				cooldown.start(err.retryAfterSeconds ?? DEFAULT_RATE_LIMIT_COOLDOWN_SECONDS);
			}
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
					placeholder: 'mail@example.com',
					autocomplete: 'email'
				},
				{
					name: 'username',
					label: $translationStore.auth.username,
					type: 'text',
					placeholder: 'user',
					autocomplete: 'username'
				},
				{
					name: 'password',
					label: $translationStore.auth.password,
					type: 'password',
					placeholder: '••••••••',
					autocomplete: 'new-password'
				},
				{
					name: 'confirmPassword',
					label: $translationStore.auth.confirmPassword,
					type: 'password',
					placeholder: '••••••••',
					autocomplete: 'new-password'
				}
			]}
			{values}
			error={bannerMessage}
			{fieldErrors}
			{loading}
			disabled={cooldown.active}
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
					class="ml-1 font-medium text-primary-700 underline hover:text-primary-600"
				>
					{$translationStore.auth.loginHere}
				</a>
			{/snippet}
		</AuthForm>
	</Card>
</div>
