<script lang="ts">
	import { Card } from 'flowbite-svelte';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<Card
	aria-busy="true"
	class="flex max-w-full! flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-0! {className}"
>
	<div class="flex grow animate-pulse flex-col p-4">
		<div class="mb-3 flex items-start justify-between gap-4">
			<div class="flex flex-col items-center gap-1">
				<div class="h-4 w-4 rounded bg-gray-200"></div>
				<div class="h-4 w-8 rounded bg-gray-200"></div>
				<div class="h-4 w-4 rounded bg-gray-200"></div>
			</div>
			<div class="flex flex-col items-end gap-2">
				<div class="h-5 w-20 rounded-full bg-gray-200"></div>
				<div class="h-5 w-16 rounded-md bg-gray-200"></div>
			</div>
		</div>
		<div class="mb-2 h-5 w-3/4 rounded bg-gray-200"></div>
		<div class="mb-2 h-4 w-full rounded bg-gray-200"></div>
		<div class="mb-4 h-4 w-5/6 rounded bg-gray-200"></div>
		<div class="mt-auto flex items-center gap-4 border-t border-gray-100 pt-4">
			<div class="h-3 w-16 rounded bg-gray-200"></div>
			<div class="h-3 w-12 rounded bg-gray-200"></div>
			<div class="ml-auto h-3 w-24 rounded bg-gray-200"></div>
		</div>
	</div>
</Card>
