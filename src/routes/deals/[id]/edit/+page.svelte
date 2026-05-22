<script lang="ts">
	import OfferForm, { type OfferFormLabels } from '$lib/components/offers/OfferForm.svelte';
	import { translationStore } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let labels: OfferFormLabels = $derived({
		heading: $translationStore.editDeal.heading,
		intro: $translationStore.editDeal.intro,
		submit: $translationStore.editDeal.submit,
		submitting: $translationStore.editDeal.submitting,
		genericError: $translationStore.editDeal.genericError,
		genericErrorKey: 'editDeal.genericError'
	});
</script>

<svelte:head>
	<title>{data.offer.title} — {$translationStore.editDeal.pageTitle}</title>
</svelte:head>

<OfferForm formData={data.form} {labels} />
