<script lang="ts">
	import { ChevronUpOutline, ChevronDownOutline } from 'flowbite-svelte-icons';
	import { castVote, removeVote } from '$lib/api/votes';
	import { translationStore } from '$lib/i18n';
	import { resolveOfferError } from '$lib/offers/offerErrors';
	import { authStore } from '$lib/stores/auth';
	import type { VoteType } from '$lib/types/vote';

	interface Props {
		offerId: string;
		initialScore: number;
		initialUserVote?: VoteType | null;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let {
		offerId,
		initialScore,
		initialUserVote = null,
		size = 'md',
		class: className = ''
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let score = $state(initialScore);
	// svelte-ignore state_referenced_locally
	let userVote = $state<VoteType | null>(initialUserVote);
	let pending = $state(false);
	let errorMessage = $state<string | null>(null);

	let isHot = $derived(score > 100);

	let iconClass = $derived(size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6');
	let gapClass = $derived(size === 'sm' ? 'gap-1' : size === 'md' ? 'gap-2' : 'gap-3');
	let scoreClass = $derived(size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg');

	async function handleVote(direction: VoteType, event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();

		if (pending) return;

		if (!$authStore.isAuthenticated) {
			errorMessage = $translationStore.errors['auth.unauthorized'];
			return;
		}

		const isToggleOff = userVote === direction;
		const prevScore = score;
		const prevVote = userVote;

		if (isToggleOff) {
			score = direction === 'UP' ? score - 1 : score + 1;
			userVote = null;
		} else if (userVote === null) {
			score = direction === 'UP' ? score + 1 : score - 1;
			userVote = direction;
		} else {
			score = direction === 'UP' ? score + 2 : score - 2;
			userVote = direction;
		}

		pending = true;
		errorMessage = null;

		try {
			const res = isToggleOff ? await removeVote(offerId) : await castVote(offerId, direction);
			score = res.score;
			userVote = res.userVote;
		} catch (error) {
			score = prevScore;
			userVote = prevVote;
			const resolved = resolveOfferError(error, $translationStore, 'vote');
			errorMessage = resolved.bannerMessage ?? $translationStore.offer.genericVoteError;
		} finally {
			pending = false;
		}
	}
</script>

<div class="flex flex-col items-start {className}">
	<div class="flex items-center font-bold {gapClass}">
		<button
			type="button"
			onclick={(event) => handleVote('UP', event)}
			disabled={pending}
			aria-label={$translationStore.deals.voteUp}
			aria-pressed={userVote === 'UP'}
			class="rounded-full p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-60 {userVote ===
			'UP'
				? 'bg-primary-50 text-primary-600'
				: 'text-gray-400 hover:bg-gray-100 hover:text-primary-500'}"
		>
			<ChevronUpOutline class={iconClass} strokeWidth="3" />
		</button>

		<span
			class="min-w-[2ch] text-center {scoreClass} {userVote === 'UP'
				? 'text-primary-600'
				: userVote === 'DOWN'
					? 'text-blue-600'
					: isHot
						? 'text-primary-500'
						: 'text-gray-700'}"
		>
			{score}°
		</span>

		<button
			type="button"
			onclick={(event) => handleVote('DOWN', event)}
			disabled={pending}
			aria-label={$translationStore.deals.voteDown}
			aria-pressed={userVote === 'DOWN'}
			class="rounded-full p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-60 {userVote ===
			'DOWN'
				? 'bg-blue-50 text-blue-600'
				: 'text-gray-400 hover:bg-gray-100 hover:text-blue-500'}"
		>
			<ChevronDownOutline class={iconClass} strokeWidth="3" />
		</button>
	</div>

	{#if errorMessage}
		<p role="alert" class="mt-1 text-xs text-red-600">{errorMessage}</p>
	{/if}
</div>
