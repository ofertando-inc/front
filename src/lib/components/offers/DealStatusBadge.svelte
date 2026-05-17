<script lang="ts">
	import { Badge } from 'flowbite-svelte';
	import { translationStore } from '$lib/i18n';
	import type { OfferStatus } from '$lib/types/offer';

	interface Props {
		status: OfferStatus;
		class?: string;
	}

	let { status, class: className = '' }: Props = $props();

	const colorByStatus: Record<OfferStatus, 'green' | 'yellow' | 'red' | 'gray' | 'secondary'> = {
		ACTIVE: 'green',
		REPORTED: 'yellow',
		DISABLED: 'red',
		DELETED: 'secondary',
		EXPIRED: 'gray'
	};
</script>

<Badge color={colorByStatus[status]} rounded class={className}>
	{$translationStore.offerStatus[status]}
</Badge>
