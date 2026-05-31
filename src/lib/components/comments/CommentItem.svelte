<script lang="ts">
	import { Avatar } from 'flowbite-svelte';
	import { localeStore, translationStore } from '$lib/i18n';
	import type { CommentResponse } from '$lib/types/comment';

	interface Props {
		comment: CommentResponse;
	}

	let { comment }: Props = $props();

	let dateLabel = $derived(
		new Intl.DateTimeFormat($localeStore, {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(comment.createdAt))
	);

	let initial = $derived(comment.user.username.slice(0, 1).toUpperCase());
</script>

<div class="flex gap-3">
	<Avatar cornerStyle="circular" class="bg-blue-100 text-blue-600">{initial}</Avatar>
	<div class="grow">
		<div class="mb-1 flex flex-wrap items-baseline gap-x-2">
			<span class="font-bold text-gray-900">{comment.user.username}</span>
			<span class="text-xs text-gray-500">{dateLabel}</span>
			{#if comment.editedAt && !comment.deleted}
				<span class="text-xs text-gray-400">{$translationStore.comments.edited}</span>
			{/if}
		</div>

		{#if comment.deleted}
			<p class="text-sm text-gray-400 italic">{$translationStore.comments.deletedPlaceholder}</p>
		{:else}
			<p class="whitespace-pre-wrap text-gray-700">{comment.content}</p>
		{/if}
	</div>
</div>
