<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { Button } from 'flowbite-svelte';
	import { ArrowRightOutline, ClockOutline, FireSolid } from 'flowbite-svelte-icons';
	import DealCard from '$lib/components/offers/DealCard.svelte';
	import DealCardSkeleton from '$lib/components/offers/DealCardSkeleton.svelte';
	import { listOffers } from '$lib/api/offers';
	import { translationStore } from '$lib/i18n';
	import { isOfferExpired } from '$lib/offers/expiration';
	import type { Offer } from '$lib/types/offer';

	const HOT_DISPLAY = 3;
	const RECENT_DISPLAY = 6;

	let hotDeals = $state<Offer[]>([]);
	let recentDeals = $state<Offer[]>([]);
	let hotLoading = $state(true);
	let recentLoading = $state(true);

	// The public list now returns EXPIRED offers (and ACTIVE ones whose endDate
	// just passed but whose status has not been flipped yet). The curated home
	// rows should only surface live deals, so we over-fetch, drop anything
	// expired by the OR-date rule, then trim to the display count.
	function liveOffers(offers: Offer[], count: number): Offer[] {
		return offers.filter((offer) => !isOfferExpired(offer)).slice(0, count);
	}

	onMount(async () => {
		try {
			const hot = await listOffers({ sort: 'score', period: 'week', limit: HOT_DISPLAY * 4 });
			hotDeals = liveOffers(hot.items, HOT_DISPLAY);
		} catch {
			hotDeals = [];
		} finally {
			hotLoading = false;
		}

		try {
			const recent = await listOffers({ sort: 'date', limit: RECENT_DISPLAY * 3 });
			recentDeals = liveOffers(recent.items, RECENT_DISPLAY);
		} catch {
			recentDeals = [];
		} finally {
			recentLoading = false;
		}
	});
</script>

<svelte:head>
	<title>{$translationStore.common.appName}</title>
</svelte:head>

<div class="space-y-14 sm:space-y-20">
	<!-- Hero -->
	<section
		class="hero relative overflow-hidden rounded-3xl border border-orange-100 px-6 py-12 shadow-sm sm:px-10 sm:py-16 lg:px-14 lg:py-20"
	>
		<div class="hero-grain pointer-events-none absolute inset-0" aria-hidden="true"></div>

		<div class="relative z-10 grid items-center gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-12">
			<div class="space-y-6">
				<span
					class="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/70 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-primary-700 backdrop-blur"
				>
					<span class="relative flex h-2 w-2">
						<span
							class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75"
						></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-primary-500"></span>
					</span>
					{$translationStore.home.heroEyebrow}
				</span>

				<h1
					class="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-gray-900 sm:text-5xl xl:text-6xl"
				>
					{$translationStore.home.heroTitle}
				</h1>

				<p class="text-base leading-relaxed text-gray-600 sm:text-lg">
					{$translationStore.home.heroSubtitle}
				</p>

				<div class="flex flex-wrap items-center gap-3 pt-1">
					<Button
						href={resolve('/deals')}
						class="rounded-full px-6 py-3 text-base shadow-sm shadow-primary-500/25"
					>
						{$translationStore.home.exploreCta}
						<ArrowRightOutline class="ms-2 h-5 w-5" />
					</Button>
					<Button
						href={resolve('/create-deal')}
						color="alternative"
						class="rounded-full border-orange-200 bg-white/70 px-6 py-3 text-base backdrop-blur hover:bg-white"
					>
						{$translationStore.home.publishCta}
					</Button>
				</div>
			</div>

			<!-- Decorative deal cluster (purely illustrative) -->
			<div class="relative hidden h-80 lg:block" aria-hidden="true">
				<div
					class="hero-float absolute top-1/2 left-1/2 w-64 -translate-x-1/2 -translate-y-1/2 rotate-3 rounded-2xl border border-orange-100 bg-white p-5 shadow-xl shadow-orange-900/10"
				>
					<div class="flex items-center gap-2.5">
						<div
							class="h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600"
						></div>
						<div class="flex-1 space-y-1.5">
							<div class="h-2.5 w-24 rounded-full bg-gray-200"></div>
							<div class="h-2 w-16 rounded-full bg-gray-100"></div>
						</div>
					</div>
					<div class="mt-4 flex items-end justify-between">
						<span class="font-display text-3xl font-extrabold tracking-tight text-savings-600"
							>−40%</span
						>
						<span
							class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700"
						>
							<FireSolid class="h-3.5 w-3.5" /> 248
						</span>
					</div>
					<div class="mt-4 space-y-2">
						<div class="h-2 w-full rounded-full bg-gray-100"></div>
						<div class="h-2 w-3/4 rounded-full bg-gray-100"></div>
					</div>
				</div>

				<div
					class="hero-float-slow absolute top-3 right-2 -rotate-12 rounded-2xl bg-savings-600 px-4 py-3 text-white shadow-lg shadow-savings-600/30"
				>
					<span class="block font-display text-xl font-extrabold tracking-tight">2x1</span>
				</div>

				<div
					class="hero-float-slow absolute bottom-7 left-0 inline-flex -rotate-6 items-center gap-1.5 rounded-full bg-heat-500 px-3.5 py-2 text-white shadow-lg shadow-heat-600/30"
				>
					<FireSolid class="h-4 w-4" />
				</div>

				<div
					class="hero-float absolute right-5 bottom-4 inline-flex rotate-6 items-center gap-1.5 rounded-full border border-orange-100 bg-white px-3.5 py-2 text-sm font-bold text-gray-800 shadow-md"
				>
					<ArrowRightOutline class="h-4 w-4 -rotate-90 text-savings-600" />
					<span class="text-savings-600">+312</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Hot deals -->
	<section>
		<div class="mb-6 flex items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<span
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-heat-400 to-heat-600 text-white shadow-sm shadow-heat-500/30"
				>
					<FireSolid class="h-5 w-5" />
				</span>
				<h2 class="font-display text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
					{$translationStore.home.hotDealsTitle}
				</h2>
			</div>
			<a
				href={resolve('/deals')}
				class="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800"
			>
				{$translationStore.home.viewAll}
				<ArrowRightOutline class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
			</a>
		</div>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#if hotLoading}
				{#each [0, 1, 2] as i (i)}
					<DealCardSkeleton />
				{/each}
			{:else}
				{#each hotDeals as deal (deal.id)}
					<DealCard offer={deal} />
				{/each}
			{/if}
		</div>
	</section>

	<!-- Recently added -->
	<section>
		<div class="mb-6 flex items-center gap-3">
			<span
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-sm shadow-primary-500/30"
			>
				<ClockOutline class="h-5 w-5" />
			</span>
			<h2 class="font-display text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
				{$translationStore.home.recentDealsTitle}
			</h2>
		</div>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#if recentLoading}
				{#each [0, 1, 2, 3, 4, 5] as i (i)}
					<DealCardSkeleton />
				{/each}
			{:else}
				{#each recentDeals as deal (deal.id)}
					<DealCard offer={deal} />
				{/each}
			{/if}
		</div>
	</section>
</div>

<style>
	.hero {
		background:
			radial-gradient(120% 120% at 88% 0%, rgba(251, 146, 60, 0.18) 0%, transparent 55%),
			radial-gradient(110% 110% at 0% 100%, rgba(16, 185, 129, 0.12) 0%, transparent 52%),
			radial-gradient(95% 95% at 55% 130%, rgba(226, 62, 44, 0.1) 0%, transparent 60%), #fffaf3;
	}

	:global(.dark) .hero {
		background:
			radial-gradient(120% 120% at 88% 0%, rgba(251, 146, 60, 0.12) 0%, transparent 55%),
			radial-gradient(110% 110% at 0% 100%, rgba(16, 185, 129, 0.08) 0%, transparent 52%),
			radial-gradient(95% 95% at 55% 130%, rgba(226, 62, 44, 0.08) 0%, transparent 60%), #221d19;
	}

	.hero-grain {
		background-image: radial-gradient(rgba(28, 25, 23, 0.05) 1px, transparent 1px);
		background-size: 22px 22px;
		opacity: 0.5;
		mask-image: radial-gradient(120% 120% at 50% 0%, #000 30%, transparent 75%);
	}

	:global(.dark) .hero-grain {
		background-image: radial-gradient(rgba(255, 251, 245, 0.05) 1px, transparent 1px);
	}

	.hero-float {
		animation: hero-float 6s ease-in-out infinite;
	}

	.hero-float-slow {
		animation: hero-float 8s ease-in-out infinite;
	}

	@keyframes hero-float {
		0%,
		100% {
			translate: 0 0;
		}
		50% {
			translate: 0 -10px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-float,
		.hero-float-slow {
			animation: none;
		}
	}
</style>
