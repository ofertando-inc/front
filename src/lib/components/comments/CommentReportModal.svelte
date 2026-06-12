<script lang="ts">
	import { Button, Label, Modal, Select, Textarea } from 'flowbite-svelte';
	import { reportComment } from '$lib/api/comments';
	import { translationStore } from '$lib/i18n';
	import { resolveOfferError } from '$lib/offers/offerErrors';
	import { COMMENT_REPORT_REASONS, type CommentReportReason } from '$lib/types/comment';

	interface Props {
		offerId: string;
		commentId: string;
		open: boolean;
		onSuccess?: () => void;
	}

	let { offerId, commentId, open = $bindable(), onSuccess }: Props = $props();

	let reason = $state<CommentReportReason | ''>('');
	let note = $state('');
	let submitting = $state(false);
	let errorMessage = $state<string | null>(null);

	function resetForm() {
		reason = '';
		note = '';
		errorMessage = null;
	}

	function handleCancel() {
		if (submitting) return;
		open = false;
		resetForm();
	}

	async function handleSubmit() {
		if (submitting || !reason) return;

		submitting = true;
		errorMessage = null;

		try {
			const trimmedNote = note.trim();
			const payload = trimmedNote ? { reason, note: trimmedNote } : { reason };
			await reportComment(offerId, commentId, payload);
			onSuccess?.();
			open = false;
			resetForm();
		} catch (error) {
			const resolved = resolveOfferError(error, $translationStore, 'comment');
			errorMessage = resolved.bannerMessage ?? $translationStore.comments.reportGenericError;
		} finally {
			submitting = false;
		}
	}
</script>

<Modal bind:open title={$translationStore.comments.reportTitle} size="md">
	<div class="space-y-4">
		<p class="text-sm leading-6 text-slate-600">
			{$translationStore.comments.reportDescription}
		</p>

		{#if errorMessage}
			<p
				role="alert"
				class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
			>
				{errorMessage}
			</p>
		{/if}

		<div class="space-y-2">
			<Label for="comment-report-reason" class="text-sm font-medium text-gray-700">
				{$translationStore.comments.reportReasonLabel} *
			</Label>
			<Select
				id="comment-report-reason"
				bind:value={reason}
				required
				disabled={submitting}
				class="rounded-lg border-gray-300 bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500"
			>
				<option value="" disabled>{$translationStore.comments.reportReasonPlaceholder}</option>
				{#each COMMENT_REPORT_REASONS as value (value)}
					<option {value}>{$translationStore.comments.reportReasons[value]}</option>
				{/each}
			</Select>
		</div>

		<div class="space-y-2">
			<div class="flex items-baseline justify-between gap-2">
				<Label for="comment-report-note" class="text-sm font-medium text-gray-700">
					{$translationStore.comments.reportNoteLabel}
				</Label>
				<span class="text-xs text-gray-500">{$translationStore.comments.reportNoteHint}</span>
			</div>
			<Textarea
				id="comment-report-note"
				bind:value={note}
				rows={3}
				maxlength={1000}
				placeholder={$translationStore.comments.reportNotePlaceholder}
				disabled={submitting}
				class="block w-full rounded-lg border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-primary-500"
			/>
		</div>
	</div>

	{#snippet footer()}
		<div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
			<Button
				color="alternative"
				class="w-full sm:w-auto"
				disabled={submitting}
				onclick={handleCancel}
			>
				{$translationStore.comments.cancel}
			</Button>
			<Button
				type="button"
				color="red"
				class="w-full sm:w-auto"
				loading={submitting}
				disabled={submitting || !reason}
				onclick={handleSubmit}
			>
				{submitting
					? $translationStore.comments.reportSubmitting
					: $translationStore.comments.reportSubmit}
			</Button>
		</div>
	{/snippet}
</Modal>
