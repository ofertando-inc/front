<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolveRoute } from '$app/paths';
	import AuthForm from '$lib/components/auth/AuthForm.svelte';
	import { ApiError } from '$lib/api/client';
	import { authStore } from '$lib/stores/auth';
	import { translationStore } from '$lib/i18n';

	let values = $state({
		email: '',
		username: '',
		password: ''
	});
	let error = $state<string | null>(null);
	let loading = $state(false);

	function getRegisterErrorMessage(apiError: ApiError) {
		const messages = apiError.message
			.split('\n')
			.map((message) => message.toLowerCase())
			.filter(Boolean);
		const joinedMessage = messages.join(' ');

		if (apiError.status >= 500) {
			return $translationStore.auth.serverError;
		}

		if (joinedMessage.includes('email is already registered')) {
			return $translationStore.auth.duplicateEmail;
		}

		if (joinedMessage.includes('username is already registered')) {
			return $translationStore.auth.duplicateUsername;
		}

		if (messages.some((message) => message.includes('email must be an email'))) {
			return $translationStore.auth.invalidEmail;
		}

		if (messages.some((message) => message.includes('username should not be empty'))) {
			return $translationStore.auth.usernameRequired;
		}

		if (
			messages.some((message) => message.includes('password must be longer than or equal to 8'))
		) {
			return $translationStore.auth.passwordTooShort;
		}

		if (apiError.status === 400) {
			return $translationStore.auth.validationError;
		}

		return $translationStore.auth.genericRegisterError;
	}

	async function handleSubmit() {
		error = null;
		loading = true;

		try {
			await authStore.register(values.email, values.username, values.password);
			await goto(resolveRoute('/profile', {}));
		} catch (err) {
			error =
				err instanceof ApiError
					? getRegisterErrorMessage(err)
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
