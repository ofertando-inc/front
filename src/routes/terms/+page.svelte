<script lang="ts">
	import LegalArticle from '$lib/components/layout/LegalArticle.svelte';
	import { translationStore } from '$lib/i18n';
</script>

<svelte:head>
	<title>{$translationStore.legal.terms.title} — {$translationStore.common.appName}</title>
</svelte:head>

<LegalArticle content={$translationStore.legal.terms} />
