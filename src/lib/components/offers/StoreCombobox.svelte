<script lang="ts">
	import { MapPinOutline } from 'flowbite-svelte-icons';
	import { createStore, geocode, searchStores } from '$lib/api/stores';
	import { translationStore } from '$lib/i18n';
	import type { GeocodeSuggestion, StoreResponse } from '$lib/types/store';

	interface Props {
		storeName?: string;
		storeId?: string;
		id?: string;
		name?: string;
		linkName?: string;
		placeholder?: string;
		invalid?: boolean;
		required?: boolean;
		// Called when a store is picked or created, so the form can sync the city.
		onSelect?: (store: { name: string; city: string }) => void;
	}

	let {
		storeName = $bindable(''),
		storeId = $bindable<string | undefined>(undefined),
		id,
		name,
		linkName,
		placeholder,
		invalid = false,
		required = false,
		onSelect
	}: Props = $props();

	let open = $state(false);
	let loading = $state(false);
	let creating = $state(false);
	let stores = $state<StoreResponse[]>([]);
	let geo = $state<GeocodeSuggestion[]>([]);
	let activeIndex = $state(0);

	let seq = 0;
	let debounce: ReturnType<typeof setTimeout> | undefined;

	type Option =
		| { kind: 'store'; store: StoreResponse }
		| { kind: 'geo'; suggestion: GeocodeSuggestion };
	let options = $derived<Option[]>([
		...stores.map((store) => ({ kind: 'store', store }) as const),
		...geo.map((suggestion) => ({ kind: 'geo', suggestion }) as const)
	]);

	async function runSearch(q: string) {
		const mine = ++seq;
		loading = true;
		const [storeRes, geoRes] = await Promise.allSettled([
			searchStores(q),
			q.length >= 3 ? geocode(q) : Promise.resolve<GeocodeSuggestion[]>([])
		]);
		if (mine !== seq) return; // a newer query superseded this one
		stores = storeRes.status === 'fulfilled' ? storeRes.value : [];
		// Keep only geocode candidates we can turn into a store (a city is required).
		geo = geoRes.status === 'fulfilled' ? geoRes.value.filter((s) => Boolean(s.city)) : [];
		loading = false;
		activeIndex = 0;
	}

	function handleInput() {
		storeId = undefined; // editing the text invalidates a previous selection
		open = true;
		clearTimeout(debounce);
		const q = storeName.trim();
		if (!q) {
			stores = [];
			geo = [];
			return;
		}
		debounce = setTimeout(() => void runSearch(q), 300);
	}

	function pickStore(store: StoreResponse) {
		storeName = store.name;
		storeId = store.id;
		open = false;
		onSelect?.({ name: store.name, city: store.city });
	}

	async function pickSuggestion(suggestion: GeocodeSuggestion) {
		if (creating) return;
		creating = true;
		try {
			// find-or-create: same name + city collapses to the existing store.
			const store = await createStore({
				name: storeName.trim(),
				city: suggestion.city ?? '',
				region: suggestion.region ?? undefined,
				address: suggestion.address ?? suggestion.displayName,
				latitude: suggestion.latitude,
				longitude: suggestion.longitude
			});
			storeName = store.name;
			storeId = store.id;
			open = false;
			onSelect?.({ name: store.name, city: store.city });
		} catch {
			// Creation failed — keep the free-text name without a structured link.
		} finally {
			creating = false;
		}
	}

	function pickOption(option: Option) {
		if (option.kind === 'store') pickStore(option.store);
		else void pickSuggestion(option.suggestion);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			open = true;
			if (options.length) {
				event.preventDefault();
				activeIndex = (activeIndex + 1) % options.length;
			}
		} else if (event.key === 'ArrowUp' && options.length) {
			event.preventDefault();
			activeIndex = (activeIndex - 1 + options.length) % options.length;
		} else if (event.key === 'Enter' && open && options[activeIndex]) {
			event.preventDefault();
			pickOption(options[activeIndex]);
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
		bind:value={storeName}
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
		<input type="hidden" name={linkName} value={storeId ?? ''} />
	{/if}

	{#if open && (loading || options.length > 0)}
		<ul
			id="{id}-listbox"
			role="listbox"
			class="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-orange-100 bg-white py-1 shadow-lg"
		>
			{#if loading}
				<li class="px-3 py-2 text-sm text-gray-400">
					{$translationStore.createDeal.storeSearching}
				</li>
			{/if}

			{#each stores as store, i (store.id)}
				<li role="option" aria-selected={i === activeIndex}>
					<button
						type="button"
						tabindex="-1"
						onmousedown={(event) => {
							event.preventDefault();
							pickStore(store);
						}}
						class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors {i ===
						activeIndex
							? 'bg-orange-50'
							: 'hover:bg-gray-50'}"
					>
						<span class="min-w-0">
							<span class="block truncate font-medium text-gray-900">{store.name}</span>
							<span class="block truncate text-xs text-gray-400">{store.city}</span>
						</span>
						{#if store.verified}
							<span
								class="shrink-0 rounded-full bg-savings-50 px-2 py-0.5 text-xs font-medium text-savings-700"
							>
								{$translationStore.createDeal.storeVerified}
							</span>
						{/if}
					</button>
				</li>
			{/each}

			{#if geo.length > 0}
				<li class="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
					{$translationStore.createDeal.storeGeocodeGroup}
				</li>
				{#each geo as suggestion, gi (suggestion.displayName + gi)}
					{@const optionIndex = stores.length + gi}
					<li role="option" aria-selected={optionIndex === activeIndex}>
						<button
							type="button"
							tabindex="-1"
							disabled={creating}
							onmousedown={(event) => {
								event.preventDefault();
								void pickSuggestion(suggestion);
							}}
							class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors disabled:opacity-60 {optionIndex ===
							activeIndex
								? 'bg-orange-50'
								: 'hover:bg-gray-50'}"
						>
							<MapPinOutline class="h-4 w-4 shrink-0 text-primary-400" />
							<span class="block truncate text-gray-700">{suggestion.displayName}</span>
						</button>
					</li>
				{/each}
			{/if}
		</ul>
	{/if}
</div>
