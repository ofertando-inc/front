<script lang="ts">
	import { MapPinOutline } from 'flowbite-svelte-icons';
	import { geocode } from '$lib/api/geocoding';
	import { translationStore } from '$lib/i18n';
	import type { GeocodeSuggestion } from '$lib/types/merchant';

	interface Props {
		// Bound to the flat location.* form fields. The city is NOT touched here — it
		// is owned by the sibling city field (constrained to the bundled list).
		address?: string;
		region?: string;
		latitude?: number;
		longitude?: number;
		// City chosen in the sibling field: appended to the geocode query so the
		// search is biased to the right place.
		cityHint?: string;
		id?: string;
		name?: string; // visible address input
		invalid?: boolean;
		required?: boolean;
	}

	let {
		address = $bindable(''),
		region = $bindable(''),
		latitude = $bindable<number | undefined>(undefined),
		longitude = $bindable<number | undefined>(undefined),
		cityHint = '',
		id,
		name,
		invalid = false,
		required = false
	}: Props = $props();

	let open = $state(false);
	let loading = $state(false);
	let suggestions = $state<GeocodeSuggestion[]>([]);
	let activeIndex = $state(0);

	let seq = 0;
	let debounce: ReturnType<typeof setTimeout> | undefined;

	async function runGeocode(q: string) {
		const mine = ++seq;
		loading = true;
		try {
			const result = await geocode(q);
			if (mine !== seq) return;
			// Keep only candidates that resolved to a city (required to register).
			suggestions = result.filter((suggestion) => Boolean(suggestion.city));
		} catch {
			if (mine === seq) suggestions = [];
		} finally {
			if (mine === seq) {
				loading = false;
				activeIndex = 0;
			}
		}
	}

	function handleInput() {
		// The coordinates are owned by the map (the user can drag the pin), so the
		// free-text address edits independently and never clears them.
		open = true;
		clearTimeout(debounce);
		const q = address.trim();
		if (q.length < 3) {
			suggestions = [];
			return;
		}
		// Bias the lookup toward the chosen city when one was entered.
		const full = cityHint.trim() ? `${q}, ${cityHint.trim()}` : q;
		debounce = setTimeout(() => void runGeocode(full), 300);
	}

	function pick(suggestion: GeocodeSuggestion) {
		// Keep the user's exact address line and their chosen city — the suggestion
		// only anchors the region and coordinates.
		region = suggestion.region ?? '';
		latitude = suggestion.latitude;
		longitude = suggestion.longitude;
		open = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			open = true;
			if (suggestions.length) {
				event.preventDefault();
				activeIndex = (activeIndex + 1) % suggestions.length;
			}
		} else if (event.key === 'ArrowUp' && suggestions.length) {
			event.preventDefault();
			activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
		} else if (event.key === 'Enter' && open && suggestions[activeIndex]) {
			event.preventDefault();
			pick(suggestions[activeIndex]);
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
		{required}
		type="text"
		bind:value={address}
		autocomplete="off"
		role="combobox"
		aria-expanded={open}
		aria-controls="{id}-listbox"
		aria-autocomplete="list"
		aria-invalid={invalid ? 'true' : undefined}
		oninput={handleInput}
		onkeydown={handleKeydown}
		onblur={() => setTimeout(() => (open = false), 150)}
		placeholder={$translationStore.createDeal.addressPlaceholder}
		class={inputClass}
	/>

	<!-- Region/coordinates shipped alongside the address; the city ships from the
	     sibling city field. -->
	<input type="hidden" name="locationRegion" value={region} />
	<input type="hidden" name="locationLatitude" value={latitude ?? ''} />
	<input type="hidden" name="locationLongitude" value={longitude ?? ''} />

	{#if open && (loading || suggestions.length > 0)}
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

			{#each suggestions as suggestion, i (suggestion.displayName + i)}
				<li role="option" aria-selected={i === activeIndex}>
					<button
						type="button"
						tabindex="-1"
						onmousedown={(event) => {
							event.preventDefault();
							pick(suggestion);
						}}
						class="flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors {i ===
						activeIndex
							? 'bg-orange-50'
							: 'hover:bg-gray-50'}"
					>
						<MapPinOutline class="mt-0.5 h-4 w-4 shrink-0 text-primary-400" />
						<span class="min-w-0">
							<span class="block text-gray-700">{suggestion.address ?? suggestion.displayName}</span
							>
							{#if suggestion.city}
								<span class="block text-xs text-gray-400">
									{[suggestion.city, suggestion.region].filter(Boolean).join(', ')}
								</span>
							{/if}
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
