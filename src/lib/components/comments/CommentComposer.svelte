<script lang="ts">
	import { Button, Textarea } from 'flowbite-svelte';
	import { translationStore } from '$lib/i18n';

	interface Props {
		value: string;
		submitting?: boolean;
		placeholder?: string;
		submitLabel?: string;
		submittingLabel?: string;
		onSubmit: () => void;
		onCancel?: () => void;
	}

	let {
		value = $bindable(),
		submitting = false,
		placeholder,
		submitLabel,
		submittingLabel,
		onSubmit,
		onCancel
	}: Props = $props();

	let canSubmit = $derived(value.trim().length > 0 && !submitting);
</script>

<div class="space-y-2">
	<Textarea
		bind:value
		rows={3}
		maxlength={2000}
		disabled={submitting}
		placeholder={placeholder ?? $translationStore.comments.placeholder}
		class="block w-full rounded-lg border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-primary-500"
	/>
	<div class="flex justify-end gap-2">
		{#if onCancel}
			<Button color="alternative" size="sm" disabled={submitting} onclick={onCancel}>
				{$translationStore.comments.cancel}
			</Button>
		{/if}
		<Button size="sm" class="rounded-lg" disabled={!canSubmit} onclick={onSubmit}>
			{submitting
				? (submittingLabel ?? $translationStore.comments.submitting)
				: (submitLabel ?? $translationStore.comments.submit)}
		</Button>
	</div>
</div>
