<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Button, Card } from 'flowbite-svelte';
	import { translationStore } from '$lib/i18n';

	const isNotFound = $derived(page.status === 404);
	const title = $derived(
		isNotFound
			? $translationStore.errorPage.notFoundTitle
			: $translationStore.errorPage.genericTitle
	);
	const description = $derived(
		isNotFound
			? $translationStore.errorPage.notFoundDescription
			: $translationStore.errorPage.genericDescription
	);
</script>

<svelte:head>
	<title>{title} — {$translationStore.common.appName}</title>
</svelte:head>

<section class="flex min-h-[calc(100vh-9rem)] items-center justify-center py-8 sm:py-12">
	<Card
		class="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm"
	>
		<p class="text-6xl font-extrabold text-primary-500">{page.status}</p>
		<h1 class="mt-4 text-2xl font-bold text-gray-900">{title}</h1>
		<p class="mt-3 text-sm leading-6 text-gray-600">{description}</p>
		<div class="mt-6 flex justify-center">
			<Button href={resolve('/')} class="rounded-xl">
				{$translationStore.errorPage.backToHome}
			</Button>
		</div>
	</Card>
</section>
