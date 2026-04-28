<script lang="ts">
	import { goto } from '$app/navigation';
	import AuthForm from '$lib/components/auth/AuthForm.svelte';
	import { ApiError } from '$lib/api/client';
	import { authStore } from '$lib/stores/auth';
	import { translationStore } from '$lib/i18n';

	let values = $state({
		email: '',
		password: ''
	});
	let error = $state<string | null>(null);
	let loading = $state(false);

	function getLoginErrorMessage(apiError: ApiError) {
		if (apiError.status === 401) {
			return $translationStore.auth.invalidCredentials;
		}

		return $translationStore.auth.genericLoginError;
	}

	async function handleSubmit() {
		error = null;
		loading = true;

		try {
			await authStore.login(values.email, values.password);
			await goto('/profile');
		} catch (err) {
			error =
				err instanceof ApiError
					? getLoginErrorMessage(err)
					: $translationStore.auth.genericLoginError;
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{$translationStore.auth.loginTitle}</title>
</svelte:head>

<div class="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
	<section class="rounded-4x1 bg-slate-950 p-8 text-white shadow-2xl shadow-orange-200/50">
		<h1 class="mt-4 text-4xl font-semibold">{$translationStore.auth.loginTitle}</h1>
		<p class="mt-4 max-w-md text-sm leading-7 text-slate-300">
			{$translationStore.auth.loginDescription}
		</p>
	</section>

	<section class="rounded-4x1 bg-white p-8 shadow-xl shadow-orange-100/60">
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
			{error}
			{loading}
			onSubmit={handleSubmit}
		/>
	</section>
</div>
