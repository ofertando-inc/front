<script lang="ts">
	import OfferForm, { type OfferFormLabels } from '$lib/components/offers/OfferForm.svelte';
	import { translationStore } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let labels: OfferFormLabels = $derived({
		heading: $translationStore.createDeal.heading,
		intro: $translationStore.createDeal.intro,
		submit: $translationStore.createDeal.submit,
		submitting: $translationStore.createDeal.submitting,
		genericError: $translationStore.createDeal.genericError,
		genericErrorKey: 'createDeal.genericError'
	});
</script>

<svelte:head>
	<title>{$translationStore.createDeal.pageTitle}</title>
</svelte:head>

<OfferForm formData={data.form} categories={data.categories} {labels} />
