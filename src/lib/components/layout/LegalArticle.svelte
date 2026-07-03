<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from 'flowbite-svelte';
	import { ArrowLeftOutline } from 'flowbite-svelte-icons';
	import { translationStore } from '$lib/i18n';

	interface LegalContent {
		title: string;
		intro: string;
		sections: { heading: string; body: string }[];
	}

	let { content }: { content: LegalContent } = $props();
</script>

<article class="mx-auto max-w-3xl py-8 sm:py-12">
	<h1 class="font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
		{content.title}
	</h1>
	<p class="mt-2 text-sm text-gray-500">{$translationStore.legal.lastUpdated}</p>
	<p class="mt-6 text-lg leading-relaxed text-gray-600">{content.intro}</p>

	<div class="mt-8 space-y-8">
		{#each content.sections as section (section.heading)}
			<section>
				<h2 class="font-display text-xl font-bold text-gray-900">{section.heading}</h2>
				<p class="mt-2 leading-relaxed text-gray-600">{section.body}</p>
			</section>
		{/each}
	</div>

	<div class="mt-10">
		<Button href={resolve('/')} color="alternative" class="rounded-full">
			<ArrowLeftOutline class="mr-2 h-4 w-4" />
			{$translationStore.legal.backHome}
		</Button>
	</div>
</article>
