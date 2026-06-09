<script lang="ts">
	import { resolve } from '$app/paths';
	import { ClipboardListOutline, FlagOutline, MessagesOutline } from 'flowbite-svelte-icons';
	import { translationStore } from '$lib/i18n';
	import { moderationSummary } from '$lib/stores/moderationSummary';

	let summary = $derived($moderationSummary);
	let loaded = $derived(summary !== null);
	let pendingComments = $derived(summary?.pendingComments ?? 0);
	let pendingReports = $derived(summary?.pendingOfferReports ?? 0);
	let total = $derived(pendingComments + pendingReports);

	function display(value: number): string {
		return loaded ? String(value) : '—';
	}
</script>

<div class="space-y-6">
	<p class="text-base text-gray-600">{$translationStore.admin.dashboardSubtitle}</p>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<a
			href={resolve('/admin/comments')}
			class="group flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
		>
			<div class="flex items-start justify-between">
				<span
					class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600"
				>
					<MessagesOutline class="h-5 w-5" />
				</span>
				<span class="text-4xl font-extrabold text-gray-900 tabular-nums">
					{display(pendingComments)}
				</span>
			</div>
			<div>
				<p class="text-sm font-medium text-gray-500">
					{$translationStore.admin.statPendingComments}
				</p>
				<p
					class="mt-1 text-sm font-semibold text-primary-600 transition-colors group-hover:text-primary-700"
				>
					{$translationStore.admin.viewQueue} →
				</p>
			</div>
		</a>

		<a
			href={resolve('/admin/reports')}
			class="group flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
		>
			<div class="flex items-start justify-between">
				<span
					class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"
				>
					<FlagOutline class="h-5 w-5" />
				</span>
				<span class="text-4xl font-extrabold text-gray-900 tabular-nums">
					{display(pendingReports)}
				</span>
			</div>
			<div>
				<p class="text-sm font-medium text-gray-500">
					{$translationStore.admin.statPendingReports}
				</p>
				<p
					class="mt-1 text-sm font-semibold text-primary-600 transition-colors group-hover:text-primary-700"
				>
					{$translationStore.admin.viewQueue} →
				</p>
			</div>
		</a>

		<div
			class="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-900 to-gray-700 p-5 text-white"
		>
			<div class="flex items-start justify-between">
				<span class="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
					<ClipboardListOutline class="h-5 w-5" />
				</span>
				<span class="text-4xl font-extrabold tabular-nums">{display(total)}</span>
			</div>
			<p class="text-sm font-medium text-gray-300">{$translationStore.admin.statTotalPending}</p>
		</div>
	</div>

	{#if loaded && total === 0}
		<p
			class="rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-center text-sm font-medium text-green-700"
		>
			{$translationStore.admin.statAllClear}
		</p>
	{/if}
</div>
