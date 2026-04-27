<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { translationStore } from '$lib/i18n';
</script>

<svelte:head>
	<title>{$translationStore.common.appName}</title>
</svelte:head>

<section class="grid gap-8 rounded-[2rem] bg-slate-950 px-8 py-10 text-white shadow-2xl shadow-orange-200/60 lg:grid-cols-[1.1fr_0.9fr] lg:px-12">
	<div class="space-y-5">
		<div class="inline-flex rounded-full border border-orange-400/30 bg-orange-500/15 px-4 py-2 text-sm text-orange-200">
			MVP auth-first
		</div>
		<h1 class="max-w-2xl text-4xl font-semibold tracking-tight lg:text-6xl">
			{$translationStore.common.appName}
		</h1>
		<p class="max-w-xl text-base leading-7 text-slate-300 lg:text-lg">
			Frontend base aligned to the backend auth flow first. Public content pages will come after the
			initial dev validation.
		</p>
		<div class="flex flex-wrap gap-3">
			<Button href="/login" color="light">{$translationStore.common.login}</Button>
			<Button href="/register">{$translationStore.common.register}</Button>
		</div>
	</div>

	<img
		src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80"
		alt="Shopping and deals"
		class="h-full min-h-80 w-full rounded-[1.75rem] object-cover"
	/>
</section>
