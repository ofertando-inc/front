<script lang="ts">
	import { StoreOutline } from 'flowbite-svelte-icons';
	import { searchMerchants } from '$lib/api/merchants';
	import { translationStore } from '$lib/i18n';
	import type { MerchantResponse } from '$lib/types/merchant';

	interface Props {
		merchantName?: string;
		merchantId?: string;
		id?: string;
		name?: string;
		linkName?: string;
		placeholder?: string;
		invalid?: boolean;
		required?: boolean;
	}

	let {
		merchantName = $bindable(''),
		merchantId = $bindable<string | undefined>(undefined),
		id,
		name,
		linkName,
		placeholder,
		invalid = false,
		required = false
	}: Props = $props();

	let open = $state(false);
	let loading = $state(false);
	let merchants = $state<MerchantResponse[]>([]);
	let activeIndex = $state(0);

	let seq = 0;
	let debounce: ReturnType<typeof setTimeout> | undefined;

	async function runSearch(q: string) {
		const mine = ++seq;
		loading = true;
		try {
			const result = await searchMerchants(q);
			if (mine !== seq) return; // a newer query superseded this one
			merchants = result;
		} catch {
			if (mine === seq) merchants = [];
		} finally {
			if (mine === seq) {
				loading = false;
				activeIndex = 0;
			}
		}
	}

	function handleInput() {
		// Editing the text drops a previous selection: the backend will then
		// find-or-create the merchant from the free-text name on submit.
		merchantId = undefined;
		open = true;
		clearTimeout(debounce);
		const q = merchantName.trim();
		if (!q) {
			merchants = [];
			return;
		}
		debounce = setTimeout(() => void runSearch(q), 300);
	}

	function pick(merchant: MerchantResponse) {
		merchantName = merchant.name;
		merchantId = merchant.id;
		open = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			open = true;
			if (merchants.length) {
				event.preventDefault();
				activeIndex = (activeIndex + 1) % merchants.length;
			}
		} else if (event.key === 'ArrowUp' && merchants.length) {
			event.preventDefault();
			activeIndex = (activeIndex - 1 + merchants.length) % merchants.length;
		} else if (event.key === 'Enter' && open && merchants[activeIndex]) {
			event.preventDefault();
			pick(merchants[activeIndex]);
		} else if (event.key === 'Escape') {
			open = false;
		}
	}

	const baseClass =
		'block w-full rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-primary-500';
	let inputClass = $derived(
		invalid
			? `${baseClass} border-red-400 focus:border-red-500 focus:ring-red-500`
			: `${baseClass} border-gray-300 focus:border-primary-500`
	);
</script>

<div class="relative">
	<input
		{id}
		{name}
		{placeholder}
		{required}
		type="text"
		bind:value={merchantName}
		autocomplete="off"
		role="combobox"
		aria-expanded={open}
		aria-controls="{id}-listbox"
		aria-autocomplete="list"
		aria-invalid={invalid ? 'true' : undefined}
		oninput={handleInput}
		onkeydown={handleKeydown}
		onblur={() => setTimeout(() => (open = false), 150)}
		class={inputClass}
	/>
	{#if linkName}
		<input type="hidden" name={linkName} value={merchantId ?? ''} />
	{/if}

	{#if open && (loading || merchants.length > 0)}
		<ul
			id="{id}-listbox"
			role="listbox"
			class="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-orange-100 bg-white py-1 shadow-lg"
		>
			{#if loading}
				<li class="px-3 py-2 text-sm text-gray-400">
					{$translationStore.createDeal.merchantSearching}
				</li>
			{/if}

			{#each merchants as merchant, i (merchant.id)}
				<li role="option" aria-selected={i === activeIndex}>
					<button
						type="button"
						tabindex="-1"
						onmousedown={(event) => {
							event.preventDefault();
							pick(merchant);
						}}
						class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors {i ===
						activeIndex
							? 'bg-orange-50'
							: 'hover:bg-gray-50'}"
					>
						<span class="flex min-w-0 items-center gap-2">
							<StoreOutline class="h-4 w-4 shrink-0 text-gray-400" />
							<span class="block truncate font-medium text-gray-900">{merchant.name}</span>
						</span>
						{#if merchant.verified}
							<span
								class="shrink-0 rounded-full bg-savings-50 px-2 py-0.5 text-xs font-medium text-savings-700"
							>
								{$translationStore.createDeal.merchantVerified}
							</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
