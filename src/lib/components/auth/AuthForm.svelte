<script lang="ts">
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
		onSubmit
	}: Props = $props();
</script>

<form class="space-y-5" on:submit|preventDefault={onSubmit}>
	<div class="space-y-2">
		<h1 class="text-3xl font-semibold text-slate-900">{title}</h1>
		<p class="text-sm leading-6 text-slate-600">{description}</p>
	</div>

	{#each fields as field}
		<div class="space-y-2">
			<Label for={field.name}>{field.label}</Label>
			<Input
				id={field.name}
				type={field.type}
				placeholder={field.placeholder}
				bind:value={values[field.name]}
				required
			/>
		</div>
	{/each}

	{#if error}
		<p class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
	{/if}

	<Button type="submit" class="w-full" disabled={loading}>
		{#if loading}{submitLabel}...{:else}{submitLabel}{/if}
	</Button>
</form>
