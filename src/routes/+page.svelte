<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { translationStore } from '$lib/i18n';
</script>

<svelte:head>
	<title>{$translationStore.common.appName}</title>
</svelte:head>

<section
	class="rounded-4x1 grid gap-8 bg-slate-950 px-8 py-10 text-white shadow-2xl shadow-orange-200/60 lg:grid-cols-[1.1fr_0.9fr] lg:px-12"
>
	<div class="space-y-5">
		<h1 class="max-w-2xl text-4xl font-semibold tracking-tight lg:text-6xl">
			{$translationStore.common.appName}
		</h1>
		<div class="flex flex-wrap gap-3">
			<Button href="/login" color="light">{$translationStore.common.login}</Button>
			<Button href="/register">{$translationStore.common.register}</Button>
		</div>
	</div>
</section>
