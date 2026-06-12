<script lang="ts">
	import { searchCities, type ColombianCity } from '$lib/offers/cities';

	interface Props {
		value?: string;
		id?: string;
		name?: string;
		placeholder?: string;
		invalid?: boolean;
		required?: boolean;
	}

	let {
		value = $bindable(''),
		id,
		name,
		placeholder,
		invalid = false,
		required = false
	}: Props = $props();

	let open = $state(false);
	let activeIndex = $state(0);

	let results = $derived(open ? searchCities(value, 8) : []);

	const baseClass =
		'block w-full rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-primary-500';
	let inputClass = $derived(
		invalid
			? `${baseClass} border-red-400 focus:border-red-500 focus:ring-red-500`
			: `${baseClass} border-gray-300 focus:border-primary-500`
	);

	function pick(city: ColombianCity) {
		value = city.name;
		open = false;
	}

	function handleInput() {
		open = true;
		activeIndex = 0;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!open || results.length === 0) {
			if (event.key === 'ArrowDown') open = true;
			return;
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			activeIndex = (activeIndex + 1) % results.length;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			activeIndex = (activeIndex - 1 + results.length) % results.length;
		} else if (event.key === 'Enter') {
			event.preventDefault();
			pick(results[activeIndex]);
		} else if (event.key === 'Escape') {
			open = false;
		}
	}
</script>

<div class="relative">
	<input
		{id}
		{name}
		{placeholder}
		{required}
		type="text"
		bind:value
		autocomplete="off"
		role="combobox"
		aria-expanded={open}
		aria-controls="{id}-listbox"
		aria-autocomplete="list"
		aria-invalid={invalid ? 'true' : undefined}
		oninput={handleInput}
		onkeydown={handleKeydown}
		onblur={() => setTimeout(() => (open = false), 120)}
		class={inputClass}
	/>

	{#if open && results.length > 0}
		<ul
			id="{id}-listbox"
			role="listbox"
			class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-orange-100 bg-white py-1 shadow-lg"
		>
			{#each results as city, index (city.name + city.department)}
				<li role="option" aria-selected={index === activeIndex}>
					<button
						type="button"
						tabindex="-1"
						onmousedown={(event) => {
							event.preventDefault();
							pick(city);
						}}
						class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors {index ===
						activeIndex
							? 'bg-orange-50'
							: 'hover:bg-gray-50'}"
					>
						<span class="font-medium text-gray-900">{city.name}</span>
						<span class="shrink-0 text-xs text-gray-400">{city.department}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
