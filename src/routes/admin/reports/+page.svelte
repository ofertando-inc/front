<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { Button, Spinner } from 'flowbite-svelte';
	import { disableOffer, dismissOffer, listAdminReports } from '$lib/api/admin';
	import { localeStore, translationStore } from '$lib/i18n';
	import { resolveOfferError } from '$lib/offers/offerErrors';
	import type { ReportSummary } from '$lib/types/admin';

	let reports = $state<ReportSummary[]>([]);
	let nextCursor = $state<string | null>(null);
	let loading = $state(true);
	let loadingMore = $state(false);
	let pendingOfferId = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);

	let dateFormatter = $derived(
		new Intl.DateTimeFormat($localeStore, { day: 'numeric', month: 'short', year: 'numeric' })
	);

	onMount(() => {
		void loadReports();
	});

	async function loadReports() {
		loading = true;
		errorMessage = null;

		try {
			const res = await listAdminReports({ limit: 20 });
			reports = res.items;
			nextCursor = res.nextCursor;
		} catch (error) {
			errorMessage = resolveOfferError(error, $translationStore, 'browse').bannerMessage;
		} finally {
			loading = false;
		}
	}

	async function loadMore() {
		if (!nextCursor || loadingMore) return;
		loadingMore = true;
		errorMessage = null;

		try {
			const res = await listAdminReports({ limit: 20, cursor: nextCursor });
			reports = [...reports, ...res.items];
			nextCursor = res.nextCursor;
		} catch (error) {
			errorMessage = resolveOfferError(error, $translationStore, 'browse').bannerMessage;
		} finally {
			loadingMore = false;
		}
	}

	// Resolution is per offer: acting on one report clears every pending report of
	// that offer, so we drop all of its rows from the queue.
	function removeOfferRows(offerId: string) {
		reports = reports.filter((r) => r.offer.id !== offerId);
	}

	async function handleDismiss(report: ReportSummary) {
		if (pendingOfferId) return;
		pendingOfferId = report.offer.id;
		errorMessage = null;
		try {
			await dismissOffer(report.offer.id);
			removeOfferRows(report.offer.id);
		} catch {
			errorMessage = $translationStore.admin.actionError;
		} finally {
			pendingOfferId = null;
		}
	}

	async function handleDisable(report: ReportSummary) {
		if (pendingOfferId) return;
		pendingOfferId = report.offer.id;
		errorMessage = null;
		try {
			await disableOffer(report.offer.id);
			removeOfferRows(report.offer.id);
		} catch {
			errorMessage = $translationStore.admin.actionError;
		} finally {
			pendingOfferId = null;
		}
	}
</script>

<div class="space-y-4">
	{#if errorMessage}
		<p
			role="alert"
			class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
		>
			{errorMessage}
		</p>
	{/if}

	{#if loading}
		<div class="flex justify-center py-12">
			<Spinner />
		</div>
	{:else if reports.length === 0}
		<p class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-500">
			{$translationStore.admin.reportsEmpty}
		</p>
	{:else}
		<div class="overflow-x-auto rounded-2xl border border-gray-200">
			<table class="w-full min-w-3xl text-left text-sm">
				<thead class="bg-gray-50 text-xs text-gray-500 uppercase">
					<tr>
						<th class="px-4 py-3">{$translationStore.admin.thReportedOffer}</th>
						<th class="px-4 py-3">{$translationStore.admin.thReason}</th>
						<th class="px-4 py-3">{$translationStore.admin.thComment}</th>
						<th class="px-4 py-3">{$translationStore.admin.thReporter}</th>
						<th class="px-4 py-3 text-right">{$translationStore.admin.thDate}</th>
						<th class="px-4 py-3 text-right">{$translationStore.admin.thActions}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each reports as report (report.id)}
						<tr class="bg-white">
							<td class="px-4 py-3">
								<a
									href={resolve('/deals/[id]', { id: report.offer.id })}
									class="font-medium text-gray-900 hover:text-primary-600"
								>
									{report.offer.title}
								</a>
							</td>
							<td class="px-4 py-3 text-gray-700">
								{$translationStore.report.reasons[report.reason]}
							</td>
							<td class="px-4 py-3 text-gray-600">
								{#if report.comment}
									{report.comment}
								{:else}
									<span class="text-gray-400 italic">{$translationStore.admin.noComment}</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-gray-600">{report.user.username}</td>
							<td class="px-4 py-3 text-right whitespace-nowrap text-gray-500">
								{dateFormatter.format(new Date(report.createdAt))}
							</td>
							<td class="px-4 py-3">
								<div class="flex flex-wrap justify-end gap-2">
									<Button
										size="xs"
										color="alternative"
										disabled={pendingOfferId === report.offer.id}
										onclick={() => handleDismiss(report)}
									>
										{$translationStore.admin.actionDismiss}
									</Button>
									<Button
										size="xs"
										color="red"
										disabled={pendingOfferId === report.offer.id}
										onclick={() => handleDisable(report)}
									>
										{$translationStore.admin.actionDisable}
									</Button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if nextCursor}
			<div class="flex justify-center pt-2">
				<Button color="alternative" disabled={loadingMore} onclick={loadMore}>
					{loadingMore ? $translationStore.common.loading : $translationStore.admin.loadMore}
				</Button>
			</div>
		{/if}
	{/if}
</div>
