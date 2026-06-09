<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { Button, Spinner } from 'flowbite-svelte';
	import {
		dismissComment,
		hideComment,
		listAdminComments,
		listAdminCommentReports
	} from '$lib/api/admin';
	import { localeStore, translationStore } from '$lib/i18n';
	import { resolveOfferError } from '$lib/offers/offerErrors';
	import type { CommentModerationSummary, ReportDetail } from '$lib/types/admin';
	import type { CommentReportReason } from '$lib/types/comment';

	let comments = $state<CommentModerationSummary[]>([]);
	let nextCursor = $state<string | null>(null);
	let loading = $state(true);
	let loadingMore = $state(false);
	let pendingId = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);

	let expandedId = $state<string | null>(null);
	let reports = $state<ReportDetail[]>([]);
	let reportsLoading = $state(false);

	let dateFormatter = $derived(
		new Intl.DateTimeFormat($localeStore, {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	);

	onMount(() => {
		void load();
	});

	function reasonLabel(reason: string): string {
		return $translationStore.comments.reportReasons[reason as CommentReportReason] ?? reason;
	}

	async function load() {
		loading = true;
		errorMessage = null;
		try {
			const res = await listAdminComments({ limit: 20 });
			comments = res.items;
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
			const res = await listAdminComments({ limit: 20, cursor: nextCursor });
			comments = [...comments, ...res.items];
			nextCursor = res.nextCursor;
		} catch (error) {
			errorMessage = resolveOfferError(error, $translationStore, 'browse').bannerMessage;
		} finally {
			loadingMore = false;
		}
	}

	function removeFromQueue(id: string) {
		comments = comments.filter((c) => c.id !== id);
		if (expandedId === id) expandedId = null;
	}

	async function handleHide(comment: CommentModerationSummary) {
		if (pendingId) return;
		pendingId = comment.id;
		errorMessage = null;
		try {
			await hideComment(comment.id);
			removeFromQueue(comment.id);
		} catch {
			errorMessage = $translationStore.admin.actionError;
		} finally {
			pendingId = null;
		}
	}

	async function handleDismiss(comment: CommentModerationSummary) {
		if (pendingId) return;
		pendingId = comment.id;
		errorMessage = null;
		try {
			await dismissComment(comment.id);
			removeFromQueue(comment.id);
		} catch {
			errorMessage = $translationStore.admin.actionError;
		} finally {
			pendingId = null;
		}
	}

	async function toggleReports(comment: CommentModerationSummary) {
		if (expandedId === comment.id) {
			expandedId = null;
			return;
		}
		expandedId = comment.id;
		reports = [];
		reportsLoading = true;
		try {
			const res = await listAdminCommentReports(comment.id, { limit: 50 });
			reports = res.items;
		} catch {
			errorMessage = $translationStore.admin.actionError;
			expandedId = null;
		} finally {
			reportsLoading = false;
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
		<div class="flex justify-center py-12"><Spinner /></div>
	{:else if comments.length === 0}
		<p class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-500">
			{$translationStore.admin.commentsEmpty}
		</p>
	{:else}
		<div class="overflow-x-auto rounded-2xl border border-gray-200">
			<table class="w-full min-w-3xl text-left text-sm">
				<thead class="bg-gray-50 text-xs text-gray-500 uppercase">
					<tr>
						<th class="px-4 py-3">{$translationStore.admin.thContent}</th>
						<th class="px-4 py-3">{$translationStore.admin.thAuthor}</th>
						<th class="px-4 py-3">{$translationStore.admin.thReportedOffer}</th>
						<th class="px-4 py-3 text-right">{$translationStore.admin.thReports}</th>
						<th class="px-4 py-3 text-right">{$translationStore.admin.thActions}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each comments as comment (comment.id)}
						<tr class="bg-white align-top">
							<td class="max-w-md px-4 py-3 text-gray-700">{comment.content}</td>
							<td class="px-4 py-3 text-gray-600">{comment.user.username}</td>
							<td class="px-4 py-3">
								<a
									href={resolve('/deals/[id]', { id: comment.offer.id })}
									class="font-medium text-gray-900 hover:text-primary-600"
								>
									{comment.offer.title}
								</a>
							</td>
							<td class="px-4 py-3 text-right font-semibold text-gray-700">
								{comment.reportCount}
							</td>
							<td class="px-4 py-3">
								<div class="flex flex-wrap justify-end gap-2">
									<Button size="xs" color="alternative" onclick={() => toggleReports(comment)}>
										{expandedId === comment.id
											? $translationStore.admin.hideReports
											: $translationStore.admin.viewReports}
									</Button>
									<Button
										size="xs"
										color="alternative"
										disabled={pendingId === comment.id}
										onclick={() => handleDismiss(comment)}
									>
										{$translationStore.admin.actionDismiss}
									</Button>
									<Button
										size="xs"
										color="red"
										disabled={pendingId === comment.id}
										onclick={() => handleHide(comment)}
									>
										{$translationStore.admin.actionHide}
									</Button>
								</div>
							</td>
						</tr>
						{#if expandedId === comment.id}
							<tr class="bg-gray-50">
								<td colspan="5" class="px-4 py-3">
									{#if reportsLoading}
										<div class="flex justify-center py-3"><Spinner size="5" /></div>
									{:else}
										<ul class="space-y-2">
											{#each reports as report (report.id)}
												<li class="text-sm">
													<span class="font-medium text-gray-800">{reasonLabel(report.reason)}</span
													>
													<span class="text-gray-400"> · {report.user.username} · </span>
													<span class="text-gray-500">
														{dateFormatter.format(new Date(report.createdAt))}
													</span>
													{#if report.note}
														<p class="text-gray-600">{report.note}</p>
													{:else}
														<p class="text-gray-400 italic">{$translationStore.admin.noteEmpty}</p>
													{/if}
												</li>
											{/each}
										</ul>
									{/if}
								</td>
							</tr>
						{/if}
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
