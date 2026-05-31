<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button, Spinner } from 'flowbite-svelte';
	import { createComment, listComments } from '$lib/api/comments';
	import { authStore } from '$lib/stores/auth';
	import { translationStore } from '$lib/i18n';
	import { resolveOfferError } from '$lib/offers/offerErrors';
	import type { CommentResponse } from '$lib/types/comment';
	import CommentComposer from './CommentComposer.svelte';
	import CommentNode from './CommentNode.svelte';

	interface Props {
		offerId: string;
		onCountChange?: (delta: number) => void;
	}

	let { offerId, onCountChange }: Props = $props();

	let comments = $state<CommentResponse[]>([]);
	let nextCursor = $state<string | null>(null);
	let loading = $state(true);
	let loadingMore = $state(false);
	let posting = $state(false);
	let draft = $state('');
	let errorMessage = $state<string | null>(null);

	onMount(() => {
		void load();
	});

	async function load() {
		loading = true;
		errorMessage = null;
		try {
			const res = await listComments(offerId, { limit: 20 });
			comments = res.items;
			nextCursor = res.nextCursor;
		} catch (error) {
			errorMessage = resolveOfferError(error, $translationStore, 'comment').bannerMessage;
		} finally {
			loading = false;
		}
	}

	async function loadMore() {
		if (!nextCursor || loadingMore) return;
		loadingMore = true;
		errorMessage = null;
		try {
			const res = await listComments(offerId, { limit: 20, cursor: nextCursor });
			comments = [...comments, ...res.items];
			nextCursor = res.nextCursor;
		} catch (error) {
			errorMessage = resolveOfferError(error, $translationStore, 'comment').bannerMessage;
		} finally {
			loadingMore = false;
		}
	}

	async function submit() {
		if (!draft.trim() || posting) return;
		if (!$authStore.isAuthenticated) {
			void goto(resolve('/login'));
			return;
		}

		posting = true;
		errorMessage = null;
		try {
			const created = await createComment(offerId, { content: draft.trim() });
			comments = [created, ...comments];
			draft = '';
			onCountChange?.(1);
		} catch (error) {
			errorMessage = resolveOfferError(error, $translationStore, 'comment').bannerMessage;
		} finally {
			posting = false;
		}
	}
</script>

<div class="space-y-6">
	<CommentComposer bind:value={draft} submitting={posting} onSubmit={submit} />

	{#if errorMessage}
		<p
			role="alert"
			class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
		>
			{errorMessage}
		</p>
	{/if}

	{#if loading}
		<div class="flex justify-center py-6"><Spinner /></div>
	{:else if comments.length === 0}
		<p class="py-4 text-sm text-gray-500">{$translationStore.comments.empty}</p>
	{:else}
		<div class="space-y-6">
			{#each comments as comment (comment.id)}
				<CommentNode
					{offerId}
					{comment}
					{onCountChange}
					onRemove={() => (comments = comments.filter((c) => c.id !== comment.id))}
				/>
			{/each}
		</div>

		{#if nextCursor}
			<div class="flex justify-center">
				<Button color="alternative" size="sm" disabled={loadingMore} onclick={loadMore}>
					{loadingMore ? $translationStore.common.loading : $translationStore.comments.loadMore}
				</Button>
			</div>
		{/if}
	{/if}
</div>
