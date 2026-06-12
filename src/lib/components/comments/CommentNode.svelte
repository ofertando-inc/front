<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from 'flowbite-svelte';
	import { createComment, deleteComment, listReplies, updateComment } from '$lib/api/comments';
	import { authStore } from '$lib/stores/auth';
	import { translationStore } from '$lib/i18n';
	import { resolveOfferError } from '$lib/offers/offerErrors';
	import type { CommentResponse } from '$lib/types/comment';
	import CommentComposer from './CommentComposer.svelte';
	import CommentItem from './CommentItem.svelte';

	interface Props {
		offerId: string;
		comment: CommentResponse;
		onCountChange?: (delta: number) => void;
		onRemove?: () => void;
	}

	let { offerId, comment, onCountChange, onRemove }: Props = $props();

	// svelte-ignore state_referenced_locally
	let root = $state(comment);
	let replies = $state<CommentResponse[]>([]);
	let repliesCursor = $state<string | null>(null);
	let repliesLoaded = $state(false);
	let expanded = $state(false);
	let repliesLoading = $state(false);

	let replyOpen = $state(false);
	let replyDraft = $state('');
	let replyPosting = $state(false);
	let replyParentId = $state('');
	let replyToUsername = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);

	// Replies read oldest-first, regardless of backend, pagination or insertion order.
	let sortedReplies = $derived(
		[...replies].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
	);

	onMount(() => {
		// A single reply is shown by default; threads with two or more stay
		// collapsed behind the "view replies" toggle.
		if (root.replyCount === 1) void toggleReplies();
	});

	function canEdit(c: CommentResponse): boolean {
		return (
			$authStore.isAuthenticated && !c.deleted && !c.hidden && $authStore.user?.id === c.user.id
		);
	}

	function canDelete(c: CommentResponse): boolean {
		return (
			$authStore.isAuthenticated &&
			!c.deleted &&
			!c.hidden &&
			($authStore.user?.id === c.user.id || $authStore.user?.role === 'ADMIN')
		);
	}

	function reportError(error: unknown) {
		errorMessage = resolveOfferError(error, $translationStore, 'comment').bannerMessage;
	}

	async function toggleReplies() {
		if (repliesLoaded) {
			expanded = !expanded;
			return;
		}
		repliesLoading = true;
		errorMessage = null;
		try {
			const res = await listReplies(offerId, root.id, { limit: 20 });
			replies = res.items;
			repliesCursor = res.nextCursor;
			repliesLoaded = true;
			expanded = true;
		} catch (error) {
			reportError(error);
		} finally {
			repliesLoading = false;
		}
	}

	async function loadMoreReplies() {
		if (!repliesCursor || repliesLoading) return;
		repliesLoading = true;
		errorMessage = null;
		try {
			const res = await listReplies(offerId, root.id, { limit: 20, cursor: repliesCursor });
			replies = [...replies, ...res.items];
			repliesCursor = res.nextCursor;
		} catch (error) {
			reportError(error);
		} finally {
			repliesLoading = false;
		}
	}

	function openReplyTo(parentId: string, username: string | null) {
		if (!$authStore.isAuthenticated) {
			void goto(resolve('/login'));
			return;
		}
		replyParentId = parentId;
		replyToUsername = username;
		replyOpen = true;
	}

	async function submitReply() {
		if (!replyDraft.trim() || replyPosting) return;
		replyPosting = true;
		errorMessage = null;
		try {
			const created = await createComment(offerId, {
				content: replyDraft.trim(),
				parentId: replyParentId
			});
			if (repliesLoaded) {
				// The list is already loaded: append the new reply and keep it visible.
				replies = [...replies, created];
				expanded = true;
			} else if (root.replyCount === 0) {
				// First reply of the thread: the full list is just this one, so show it
				// (matches the single-reply default).
				replies = [created];
				repliesLoaded = true;
				expanded = true;
			}
			// Otherwise replies exist but were never expanded: just bump the count and
			// leave them collapsed behind the toggle (2+ replies stay hidden by default).
			root.replyCount += 1;
			replyOpen = false;
			replyDraft = '';
			onCountChange?.(1);
		} catch (error) {
			reportError(error);
		} finally {
			replyPosting = false;
		}
	}

	async function saveRoot(content: string): Promise<boolean> {
		errorMessage = null;
		try {
			root = await updateComment(offerId, root.id, { content });
			return true;
		} catch (error) {
			reportError(error);
			return false;
		}
	}

	async function deleteRoot() {
		errorMessage = null;
		try {
			const res = await deleteComment(offerId, root.id);
			onCountChange?.(-1);
			if (res.replyCount > 0) {
				root = res;
			} else {
				onRemove?.();
			}
		} catch (error) {
			reportError(error);
		}
	}

	async function saveReply(reply: CommentResponse, content: string): Promise<boolean> {
		errorMessage = null;
		try {
			const updated = await updateComment(offerId, reply.id, { content });
			replies = replies.map((r) => (r.id === updated.id ? updated : r));
			return true;
		} catch (error) {
			reportError(error);
			return false;
		}
	}

	async function deleteReply(reply: CommentResponse) {
		errorMessage = null;
		try {
			await deleteComment(offerId, reply.id);
			replies = replies.filter((r) => r.id !== reply.id);
			root.replyCount = Math.max(0, root.replyCount - 1);
			onCountChange?.(-1);
		} catch (error) {
			reportError(error);
		}
	}
</script>

<div class="space-y-3">
	<CommentItem
		{offerId}
		comment={root}
		canReply={!root.deleted && !root.hidden}
		canEdit={canEdit(root)}
		canDelete={canDelete(root)}
		onReply={() => openReplyTo(root.id, null)}
		onSave={saveRoot}
		onDelete={deleteRoot}
	/>

	{#if errorMessage}
		<p role="alert" class="ml-12 text-xs text-red-600">{errorMessage}</p>
	{/if}

	<div class="ml-12 space-y-3">
		{#if replyOpen}
			<div class="space-y-1">
				{#if replyToUsername}
					<p class="text-xs text-primary-600">
						{$translationStore.comments.replyingTo.replace('{username}', replyToUsername)}
					</p>
				{/if}
				<CommentComposer
					bind:value={replyDraft}
					submitting={replyPosting}
					placeholder={$translationStore.comments.replyPlaceholder}
					onSubmit={submitReply}
					onCancel={() => (replyOpen = false)}
				/>
			</div>
		{/if}

		{#if root.replyCount > 0}
			<button
				type="button"
				class="text-xs font-medium text-primary-600 hover:text-primary-700"
				disabled={repliesLoading}
				onclick={toggleReplies}
			>
				{expanded
					? $translationStore.comments.hideReplies
					: $translationStore.comments.viewReplies.replace('{count}', String(root.replyCount))}
			</button>
		{/if}

		{#if expanded}
			<div class="space-y-4 border-l border-gray-100 pl-4">
				{#each sortedReplies as reply (reply.id)}
					<CommentItem
						{offerId}
						comment={reply}
						canReply={!reply.deleted && !reply.hidden}
						canEdit={canEdit(reply)}
						canDelete={canDelete(reply)}
						onReply={() => openReplyTo(reply.id, reply.user.username)}
						onSave={(content) => saveReply(reply, content)}
						onDelete={() => deleteReply(reply)}
					/>
				{/each}

				{#if repliesCursor}
					<Button color="alternative" size="xs" disabled={repliesLoading} onclick={loadMoreReplies}>
						{repliesLoading
							? $translationStore.common.loading
							: $translationStore.comments.loadMoreReplies}
					</Button>
				{/if}
			</div>
		{/if}
	</div>
</div>
