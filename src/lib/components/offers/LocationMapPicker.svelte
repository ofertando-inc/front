<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { Map as LeafletMap, Marker } from 'leaflet';
	import { reverseGeocode } from '$lib/api/geocoding';
	import 'leaflet/dist/leaflet.css';

	interface Props {
		// Authoritative coordinates, two-way bound to the location.* form fields.
		latitude?: number;
		longitude?: number;
		// Emitted after the pin moves: reverse-geocoded city/region for the new
		// point (the free-text address stays user-owned).
		onLocate?: (place: { city: string; region: string }) => void;
		class?: string;
	}

	let {
		latitude = $bindable<number | undefined>(undefined),
		longitude = $bindable<number | undefined>(undefined),
		onLocate,
		class: className = ''
	}: Props = $props();

	// Default view: roughly the centre of Colombia until a point is set.
	const DEFAULT_CENTER: [number, number] = [4.65, -74.08];
	const DEFAULT_ZOOM = 11;
	const PIN_ZOOM = 16;

	let container = $state<HTMLDivElement>();
	let map: LeafletMap | undefined;
	let marker: Marker | undefined;
	let leaflet: typeof import('leaflet') | undefined;
	// Last coordinates we pushed out, so external updates recenter the map while
	// our own drag/click updates don't trigger a feedback recenter.
	let applied: { lat?: number; lng?: number } = { lat: latitude, lng: longitude };

	const PIN_HTML =
		'<svg viewBox="0 0 24 24" width="30" height="30" fill="#ea580c" stroke="#fff" stroke-width="1.5">' +
		'<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>' +
		'<circle cx="12" cy="9" r="2.5" fill="#fff" stroke="none"/></svg>';

	let reverseSeq = 0;

	// Moving the pin updates the coordinates, then refreshes the city/region from
	// reverse geocoding so the structured location stays coherent with the point.
	// The free-text address is left untouched (owned by the user).
	function applyPoint(lat: number, lng: number) {
		applied = { lat, lng };
		latitude = lat;
		longitude = lng;
		const mine = ++reverseSeq;
		void reverseGeocode(lat, lng)
			.then((result) => {
				if (mine !== reverseSeq || !result?.city) return;
				onLocate?.({ city: result.city, region: result.region ?? '' });
			})
			.catch(() => {
				// Reverse geocoding is best-effort — the coordinates are already set.
			});
	}

	function placeMarker(lat: number, lng: number) {
		if (!map || !leaflet) return;
		if (!marker) {
			const icon = leaflet.divIcon({
				className: '',
				html: PIN_HTML,
				iconSize: [30, 30],
				iconAnchor: [15, 30]
			});
			marker = leaflet.marker([lat, lng], { draggable: true, icon }).addTo(map);
			marker.on('dragend', () => {
				const point = marker!.getLatLng();
				applyPoint(point.lat, point.lng);
			});
		} else {
			marker.setLatLng([lat, lng]);
		}
	}

	onMount(async () => {
		leaflet = await import('leaflet');
		const hasPoint = latitude != null && longitude != null;
		map = leaflet
			.map(container!)
			.setView(
				hasPoint ? [latitude!, longitude!] : DEFAULT_CENTER,
				hasPoint ? PIN_ZOOM : DEFAULT_ZOOM
			);
		leaflet
			.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution: '© OpenStreetMap'
			})
			.addTo(map);
		if (hasPoint) placeMarker(latitude!, longitude!);
		// Click anywhere to drop / move the pin.
		map.on('click', (event) => {
			placeMarker(event.latlng.lat, event.latlng.lng);
			applyPoint(event.latlng.lat, event.latlng.lng);
		});
		// The container may have been hidden when measured; refresh once laid out.
		setTimeout(() => map?.invalidateSize(), 0);
	});

	// Recenter when the coordinates change from outside (e.g. a geocode pick).
	$effect(() => {
		const lat = latitude;
		const lng = longitude;
		if (!map || lat == null || lng == null) return;
		if (applied.lat === lat && applied.lng === lng) return;
		applied = { lat, lng };
		placeMarker(lat, lng);
		map.setView([lat, lng], PIN_ZOOM);
	});

	onDestroy(() => map?.remove());
</script>

<div
	bind:this={container}
	class="h-56 w-full overflow-hidden rounded-lg border border-gray-300 {className}"
></div>
