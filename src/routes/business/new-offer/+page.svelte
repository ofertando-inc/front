<script lang="ts">
	import OfferForm from '$lib/components/offers/OfferForm.svelte';
	import { translationStore } from '$lib/i18n';

	let { data } = $props();
</script>

<svelte:head>
	<title>{$translationStore.business.officialHeading} — {$translationStore.common.appName}</title>
</svelte:head>

<OfferForm
	formData={data.form}
	categories={data.categories}
	lockedMerchantName={data.merchantName}
	labels={{
		heading: $translationStore.business.officialHeading,
		intro: $translationStore.business.officialIntro,
		submit: $translationStore.createDeal.submit,
		submitting: $translationStore.createDeal.submitting,
		genericError: $translationStore.createDeal.genericError,
		genericErrorKey: 'createDeal.genericError'
	}}
/>
