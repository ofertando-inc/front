<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolveRoute } from '$app/paths';
	import { onMount } from 'svelte';
	import AuthForm from '$lib/components/auth/AuthForm.svelte';
	import { ApiError } from '$lib/api/client';
	import { getRegisterErrorMessage } from '$lib/auth/registerErrors';
	import { authStore } from '$lib/stores/auth';
	import { translationStore } from '$lib/i18n';

	let values = $state({
		email: '',
		username: '',
		password: ''
	});
	let error = $state<string | null>(null);
	let loading = $state(false);

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
		error = null;
		loading = true;

		try {
			await authStore.register(values.email, values.username, values.password);
			await goto(resolveRoute('/profile'));
		} catch (err) {
			error =
				err instanceof ApiError
					? getRegisterErrorMessage(err, $translationStore.auth)
					: $translationStore.auth.genericRegisterError;
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{$translationStore.auth.registerTitle}</title>
</svelte:head>

<div class="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
	<section
		class="rounded-4x1 bg-linear-to-br from-orange-500 to-amber-400 p-8 text-white shadow-2xl shadow-orange-200/50"
	>
		<h1 class="mt-4 text-4xl font-semibold">{$translationStore.auth.registerTitle}</h1>
		<p class="mt-4 max-w-md text-sm leading-7 text-orange-50/90">
			{$translationStore.auth.registerDescription}
		</p>
	</section>

	<section class="rounded-4x1 bg-white p-8 shadow-xl shadow-orange-100/60">
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
			{error}
			{loading}
			onSubmit={handleSubmit}
		/>
	</section>
</div>
