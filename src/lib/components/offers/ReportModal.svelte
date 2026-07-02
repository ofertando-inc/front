<script lang="ts">
	import { Button, Label, Modal, Select, Textarea } from 'flowbite-svelte';
	import { FlagOutline } from 'flowbite-svelte-icons';
	import { submitReport } from '$lib/api/reports';
	import { translationStore } from '$lib/i18n';
	import { resolveOfferError } from '$lib/offers/offerErrors';
	import { REPORT_REASONS, type ReportReason } from '$lib/types/report';
	import type { OfferStatus } from '$lib/types/offer';

	interface Props {
		offerId: string;
		open: boolean;
		onSuccess?: (status: OfferStatus) => void;
	}

	let { offerId, open = $bindable(), onSuccess }: Props = $props();

	let reason = $state<ReportReason | ''>('');
	let comment = $state('');
	let submitting = $state(false);
	let errorMessage = $state<string | null>(null);

	function resetForm() {
		reason = '';
		comment = '';
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
			const trimmedComment = comment.trim();
			const payload = trimmedComment ? { reason, comment: trimmedComment } : { reason };
			const res = await submitReport(offerId, payload);
			onSuccess?.(res.status);
			open = false;
			resetForm();
		} catch (error) {
			const resolved = resolveOfferError(error, $translationStore, 'report');
			errorMessage = resolved.bannerMessage ?? $translationStore.report.genericError;
		} finally {
			submitting = false;
		}
	}
</script>

<Modal bind:open title={$translationStore.report.modalTitle} size="md">
	<div class="space-y-4">
		<div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
			<FlagOutline class="h-6 w-6" />
		</div>

		<p class="text-sm leading-6 text-slate-600">
			{$translationStore.report.modalDescription}
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
			<Label for="report-reason" class="text-sm font-medium text-gray-700">
				{$translationStore.report.reasonLabel} *
			</Label>
			<Select
				id="report-reason"
				bind:value={reason}
				required
				disabled={submitting}
				placeholder=""
				class="rounded-lg border-gray-300 bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500"
			>
				<option value="" disabled>{$translationStore.report.reasonPlaceholder}</option>
				{#each REPORT_REASONS as value (value)}
					<option {value}>{$translationStore.report.reasons[value]}</option>
				{/each}
			</Select>
		</div>

		<div class="space-y-2">
			<div class="flex items-baseline justify-between gap-2">
				<Label for="report-comment" class="text-sm font-medium text-gray-700">
					{$translationStore.report.commentLabel}
				</Label>
				<span class="text-xs text-gray-500">{$translationStore.report.commentHint}</span>
			</div>
			<Textarea
				id="report-comment"
				bind:value={comment}
				rows={4}
				maxlength={1000}
				placeholder={$translationStore.report.commentPlaceholder}
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
				{$translationStore.report.cancel}
			</Button>
			<Button
				type="button"
				color="red"
				class="w-full sm:w-auto"
				loading={submitting}
				disabled={submitting || !reason}
				onclick={handleSubmit}
			>
				{submitting ? $translationStore.report.submitting : $translationStore.report.submit}
			</Button>
		</div>
	{/snippet}
</Modal>
