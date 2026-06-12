<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Avatar, Button, Textarea } from 'flowbite-svelte';
	import { ChevronDownOutline, ChevronUpOutline } from 'flowbite-svelte-icons';
	import { removeCommentVote, voteComment } from '$lib/api/comments';
	import { authStore } from '$lib/stores/auth';
	import { localeStore, translationStore } from '$lib/i18n';
	import type { CommentResponse } from '$lib/types/comment';
	import type { VoteType } from '$lib/types/vote';
	import CommentReportModal from './CommentReportModal.svelte';

	interface Props {
		offerId: string;
		comment: CommentResponse;
		canReply?: boolean;
		canEdit?: boolean;
		canDelete?: boolean;
		onReply?: () => void;
		onSave?: (content: string) => Promise<boolean>;
		onDelete?: () => Promise<void> | void;
	}

	let {
		offerId,
		comment,
		canReply = false,
		canEdit = false,
		canDelete = false,
		onReply,
		onSave,
		onDelete
	}: Props = $props();

	let editing = $state(false);
	let editDraft = $state('');
	let saving = $state(false);
	let confirmingDelete = $state(false);
	let deleting = $state(false);
	let reportModalOpen = $state(false);
	let reported = $state(false);

	// svelte-ignore state_referenced_locally
	let score = $state(comment.score);
	// svelte-ignore state_referenced_locally
	let userVote = $state<VoteType | null>(comment.userVote);
	let votePending = $state(false);

	async function handleVote(direction: VoteType) {
		if (votePending) return;
		if (!$authStore.isAuthenticated) {
			void goto(resolve('/login'));
			return;
		}

		const prevVote = userVote;
		const prevScore = score;
		const isRemoving = userVote === direction;

		if (isRemoving) {
			score = direction === 'UP' ? score - 1 : score + 1;
			userVote = null;
		} else if (userVote === null) {
			score = direction === 'UP' ? score + 1 : score - 1;
			userVote = direction;
		} else {
			score = direction === 'UP' ? score + 2 : score - 2;
			userVote = direction;
		}
		votePending = true;

		try {
			const res = isRemoving
				? await removeCommentVote(offerId, comment.id)
				: await voteComment(offerId, comment.id, direction);
			score = res.score;
			userVote = res.userVote;
		} catch {
			score = prevScore;
			userVote = prevVote;
		} finally {
			votePending = false;
		}
	}

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
	let removed = $derived(comment.deleted || comment.hidden);
	let isOwn = $derived($authStore.user?.id === comment.user.id);
	let canReport = $derived(!removed && !isOwn);
	let showActions = $derived(!removed && (canReply || canEdit || canDelete || canReport));

	function openReport() {
		if (!$authStore.isAuthenticated) {
			void goto(resolve('/login'));
			return;
		}
		reportModalOpen = true;
	}

	function startEdit() {
		editDraft = comment.content ?? '';
		editing = true;
		confirmingDelete = false;
	}

	async function saveEdit() {
		if (!onSave || saving || editDraft.trim().length === 0) return;
		saving = true;
		try {
			if (await onSave(editDraft.trim())) editing = false;
		} finally {
			saving = false;
		}
	}

	async function confirmDelete() {
		if (!onDelete || deleting) return;
		deleting = true;
		try {
			await onDelete();
		} finally {
			deleting = false;
			confirmingDelete = false;
		}
	}
</script>

<div class="flex gap-3">
	<Avatar cornerStyle="circular" class="bg-blue-100 text-blue-600">{initial}</Avatar>
	<div class="grow">
		<div class="mb-1 flex flex-wrap items-baseline gap-x-2">
			<span class="font-bold text-gray-900">{comment.user.username}</span>
			<span class="text-xs text-gray-500">{dateLabel}</span>
			{#if comment.editedAt && !removed}
				<span class="text-xs text-gray-400">{$translationStore.comments.edited}</span>
			{/if}
		</div>

		{#if comment.replyTo && !removed}
			<p class="mb-1 text-xs text-primary-600">
				{$translationStore.comments.replyingTo.replace('{username}', comment.replyTo.username)}
			</p>
		{/if}

		{#if removed}
			<p class="text-sm text-gray-400 italic">
				{comment.hidden
					? $translationStore.comments.hiddenPlaceholderModerator
					: $translationStore.comments.deletedPlaceholderAuthor}
			</p>
		{:else if editing}
			<div class="space-y-2">
				<Textarea
					bind:value={editDraft}
					rows={3}
					maxlength={2000}
					disabled={saving}
					class="block w-full rounded-lg border-gray-300 bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500"
				/>
				<div class="flex justify-end gap-2">
					<Button color="alternative" size="sm" disabled={saving} onclick={() => (editing = false)}>
						{$translationStore.comments.cancel}
					</Button>
					<Button size="sm" disabled={saving || editDraft.trim().length === 0} onclick={saveEdit}>
						{saving ? $translationStore.comments.saving : $translationStore.comments.save}
					</Button>
				</div>
			</div>
		{:else}
			<p class="whitespace-pre-wrap text-gray-700">{comment.content}</p>

			<div class="mt-1 flex items-center gap-3 text-xs font-medium text-gray-500">
				<div class="flex items-center gap-1">
					<button
						type="button"
						aria-label={$translationStore.deals.voteUp}
						aria-pressed={userVote === 'UP'}
						disabled={votePending}
						class="rounded p-0.5 transition-colors disabled:opacity-60 {userVote === 'UP'
							? 'text-primary-600'
							: 'hover:text-primary-600'}"
						onclick={() => handleVote('UP')}
					>
						<ChevronUpOutline class="h-4 w-4" strokeWidth="3" />
					</button>
					<span
						class="min-w-[2ch] text-center {userVote === 'UP'
							? 'text-primary-600'
							: userVote === 'DOWN'
								? 'text-blue-600'
								: 'text-gray-700'}"
					>
						{score}
					</span>
					<button
						type="button"
						aria-label={$translationStore.deals.voteDown}
						aria-pressed={userVote === 'DOWN'}
						disabled={votePending}
						class="rounded p-0.5 transition-colors disabled:opacity-60 {userVote === 'DOWN'
							? 'text-blue-600'
							: 'hover:text-blue-600'}"
						onclick={() => handleVote('DOWN')}
					>
						<ChevronDownOutline class="h-4 w-4" strokeWidth="3" />
					</button>
				</div>

				{#if showActions}
					{#if canReply}
						<button type="button" class="hover:text-primary-600" onclick={onReply}>
							{$translationStore.comments.reply}
						</button>
					{/if}
					{#if canEdit && onSave}
						<button type="button" class="hover:text-primary-600" onclick={startEdit}>
							{$translationStore.comments.edit}
						</button>
					{/if}
					{#if canDelete && onDelete}
						{#if confirmingDelete}
							<span class="text-gray-600">{$translationStore.comments.deleteConfirm}</span>
							<button
								type="button"
								class="text-red-600 hover:text-red-700"
								disabled={deleting}
								onclick={confirmDelete}
							>
								{$translationStore.comments.delete}
							</button>
							<button
								type="button"
								class="hover:text-gray-700"
								disabled={deleting}
								onclick={() => (confirmingDelete = false)}
							>
								{$translationStore.comments.cancel}
							</button>
						{:else}
							<button
								type="button"
								class="hover:text-red-600"
								onclick={() => (confirmingDelete = true)}
							>
								{$translationStore.comments.delete}
							</button>
						{/if}
					{/if}
					{#if canReport}
						{#if reported}
							<span class="text-gray-400">{$translationStore.comments.reported}</span>
						{:else}
							<button type="button" class="hover:text-red-600" onclick={openReport}>
								{$translationStore.comments.report}
							</button>
						{/if}
					{/if}
				{/if}
			</div>
		{/if}
	</div>
</div>

{#if canReport}
	<CommentReportModal
		{offerId}
		commentId={comment.id}
		bind:open={reportModalOpen}
		onSuccess={() => (reported = true)}
	/>
{/if}
