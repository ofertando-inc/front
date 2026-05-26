<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button, Input, Label, Spinner } from 'flowbite-svelte';

	interface Field {
		name: string;
		label: string;
		type: string;
		placeholder: string;
	}

	interface Props {
		title: string;
		description: string;
		submitLabel: string;
		fields: Field[];
		values: Record<string, string>;
		error?: string | null;
		fieldErrors?: Record<string, string>;
		loading?: boolean;
		disabled?: boolean;
		centered?: boolean;
		top?: Snippet;
		alternate?: Snippet;
		onSubmit: () => void | Promise<void>;
	}

	let {
		title,
		description,
		submitLabel,
		fields,
		values,
		error = null,
		fieldErrors = {},
		loading = false,
		disabled = false,
		centered = false,
		top,
		alternate,
		onSubmit
	}: Props = $props();
</script>

<form
	class="space-y-6"
	onsubmit={(event) => {
		event.preventDefault();
		void onSubmit();
	}}
>
	<div class={centered ? 'space-y-3 text-center' : 'space-y-2'}>
		{#if top}
			{@render top()}
		{/if}
		<h1 class="text-3xl font-extrabold text-gray-900">{title}</h1>
		<p class="text-sm leading-6 text-gray-600">{description}</p>
		{#if alternate}
			<div class="text-sm text-gray-600">
				{@render alternate()}
			</div>
		{/if}
	</div>

	{#each fields as field (field.name)}
		{@const fieldError = fieldErrors[field.name]}
		<div class="space-y-2">
			<Label for={field.name} class="text-sm font-medium text-gray-700">{field.label}</Label>
			<Input
				id={field.name}
				type={field.type}
				placeholder={field.placeholder}
				bind:value={values[field.name]}
				color={fieldError ? 'red' : undefined}
				aria-invalid={fieldError ? 'true' : undefined}
				aria-describedby={fieldError ? `${field.name}-error` : undefined}
				class={fieldError
					? 'rounded-lg border-red-400 bg-white text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500'
					: 'rounded-lg border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-primary-500'}
				required
			/>
			{#if fieldError}
				<p id={`${field.name}-error`} class="text-sm text-red-600">{fieldError}</p>
			{/if}
		</div>
	{/each}

	{#if error}
		<p
			role="alert"
			class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
		>
			{error}
		</p>
	{/if}

	<Button type="submit" class="w-full rounded-xl py-3" disabled={loading || disabled}>
		{#if loading}
			<Spinner class="me-3 fill-white! text-white/30!" size="4" />
		{/if}
		{submitLabel}
	</Button>
</form>
