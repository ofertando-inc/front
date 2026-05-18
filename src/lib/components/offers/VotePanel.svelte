<script lang="ts">
	import { ChevronUpOutline, ChevronDownOutline } from 'flowbite-svelte-icons';
	import { translationStore } from '$lib/i18n';

	interface Props {
		initialScore: number;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let { initialScore, size = 'md', class: className = '' }: Props = $props();

	let vote = $state<'up' | 'down' | null>(null);
	let score = $derived(
		vote === 'up' ? initialScore + 1 : vote === 'down' ? initialScore - 1 : initialScore
	);
	let isHot = $derived(score > 100);

	let iconClass = $derived(size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6');
	let gapClass = $derived(size === 'sm' ? 'gap-1' : size === 'md' ? 'gap-2' : 'gap-3');
	let scoreClass = $derived(size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg');

	function handleVote(direction: 'up' | 'down', event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		vote = vote === direction ? null : direction;
	}
</script>

<div class="flex items-center font-bold {gapClass} {className}">
	<button
		type="button"
		onclick={(event) => handleVote('up', event)}
		aria-label={$translationStore.deals.voteUp}
		aria-pressed={vote === 'up'}
		class="rounded-full p-1 transition-colors {vote === 'up'
			? 'bg-primary-50 text-primary-600'
			: 'text-gray-400 hover:bg-gray-100 hover:text-primary-500'}"
	>
		<ChevronUpOutline class={iconClass} strokeWidth="3" />
	</button>

	<span
		class="min-w-[2ch] text-center {scoreClass} {vote === 'up'
			? 'text-primary-600'
			: vote === 'down'
				? 'text-blue-600'
				: isHot
					? 'text-primary-500'
					: 'text-gray-700'}"
	>
		{score}°
	</span>

	<button
		type="button"
		onclick={(event) => handleVote('down', event)}
		aria-label={$translationStore.deals.voteDown}
		aria-pressed={vote === 'down'}
		class="rounded-full p-1 transition-colors {vote === 'down'
			? 'bg-blue-50 text-blue-600'
			: 'text-gray-400 hover:bg-gray-100 hover:text-blue-500'}"
	>
		<ChevronDownOutline class={iconClass} strokeWidth="3" />
	</button>
</div>
