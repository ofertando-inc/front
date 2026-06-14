<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { Map as LeafletMap } from 'leaflet';
	import 'leaflet/dist/leaflet.css';

	interface Props {
		latitude: number;
		longitude: number;
		class?: string;
	}

	let { latitude, longitude, class: className = '' }: Props = $props();

	const ZOOM = 16;

	let container = $state<HTMLDivElement>();
	let map: LeafletMap | undefined;

	const PIN_HTML =
		'<svg viewBox="0 0 24 24" width="30" height="30" fill="#ea580c" stroke="#fff" stroke-width="1.5">' +
		'<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>' +
		'<circle cx="12" cy="9" r="2.5" fill="#fff" stroke="none"/></svg>';

	onMount(async () => {
		const leaflet = await import('leaflet');
		map = leaflet.map(container!, { scrollWheelZoom: false }).setView([latitude, longitude], ZOOM);
		leaflet
			.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution: '© OpenStreetMap'
			})
			.addTo(map);
		const icon = leaflet.divIcon({
			className: '',
			html: PIN_HTML,
			iconSize: [30, 30],
			iconAnchor: [15, 30]
		});
		leaflet.marker([latitude, longitude], { icon }).addTo(map);
		setTimeout(() => map?.invalidateSize(), 0);
	});

	onDestroy(() => map?.remove());
</script>

<div
	bind:this={container}
	class="h-64 w-full overflow-hidden rounded-xl border border-gray-200 {className}"
></div>
