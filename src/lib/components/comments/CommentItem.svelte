<script lang="ts">
	import { Avatar, Button, Textarea } from 'flowbite-svelte';
	import { localeStore, translationStore } from '$lib/i18n';
	import type { CommentResponse } from '$lib/types/comment';

	interface Props {
		comment: CommentResponse;
		canReply?: boolean;
		canEdit?: boolean;
		canDelete?: boolean;
		onReply?: () => void;
		onSave?: (content: string) => Promise<boolean>;
		onDelete?: () => Promise<void> | void;
	}

	let {
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
	let showActions = $derived(!comment.deleted && (canReply || canEdit || canDelete));

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
			{#if comment.editedAt && !comment.deleted}
				<span class="text-xs text-gray-400">{$translationStore.comments.edited}</span>
			{/if}
		</div>

		{#if comment.replyTo && !comment.deleted}
			<p class="mb-1 text-xs text-primary-600">
				{$translationStore.comments.replyingTo.replace('{username}', comment.replyTo.username)}
			</p>
		{/if}

		{#if comment.deleted}
			<p class="text-sm text-gray-400 italic">{$translationStore.comments.deletedPlaceholder}</p>
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

			{#if showActions}
				<div class="mt-1 flex items-center gap-3 text-xs font-medium text-gray-500">
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
				</div>
			{/if}
		{/if}
	</div>
</div>
