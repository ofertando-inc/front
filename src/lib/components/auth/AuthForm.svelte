<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button, Input, Label } from 'flowbite-svelte';

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
		loading?: boolean;
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
		loading = false,
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
		<div class="space-y-2">
			<Label for={field.name} class="text-sm font-medium text-gray-700">{field.label}</Label>
			<Input
				id={field.name}
				type={field.type}
				placeholder={field.placeholder}
				bind:value={values[field.name]}
				class="rounded-lg border-gray-300 bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500"
				required
			/>
		</div>
	{/each}

	{#if error}
		<p class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			{error}
		</p>
	{/if}

	<Button type="submit" class="w-full rounded-xl py-3" disabled={loading}>
		{#if loading}{submitLabel}...{:else}{submitLabel}{/if}
	</Button>
</form>
