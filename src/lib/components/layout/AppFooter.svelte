<script lang="ts">
	import { resolve } from '$app/paths';
	import { Footer, FooterCopyright, FooterLink, FooterLinkGroup } from 'flowbite-svelte';
	import { TagSolid } from 'flowbite-svelte-icons';
	import { translationStore } from '$lib/i18n';

	const currentYear = new Date().getFullYear();
</script>

<Footer class="border-t border-orange-100 bg-white/60">
	<div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
			<a href={resolve('/')} class="flex w-fit items-center gap-2.5">
				<span
					class="flex h-9 w-9 shrink-0 -rotate-3 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-sm shadow-primary-500/30"
				>
					<TagSolid class="h-5 w-5 -rotate-90" />
				</span>
				<span class="font-display text-lg font-extrabold tracking-tight text-gray-900">
					{$translationStore.common.appName}
				</span>
			</a>

			<FooterLinkGroup class="flex flex-wrap gap-x-5 gap-y-2">
				<FooterLink
					href={resolve('/terms')}
					class="list-none"
					classes={{ link: 'text-sm font-medium text-gray-500 hover:text-primary-600' }}
				>
					{$translationStore.footer.terms}
				</FooterLink>
				<FooterLink
					href={resolve('/privacy')}
					class="list-none"
					classes={{ link: 'text-sm font-medium text-gray-500 hover:text-primary-600' }}
				>
					{$translationStore.footer.privacy}
				</FooterLink>
			</FooterLinkGroup>
		</div>

		<hr class="my-5 border-orange-100" />

		<FooterCopyright
			href={resolve('/')}
			by={$translationStore.common.appName}
			year={currentYear}
			copyrightMessage={$translationStore.footer.rights}
			class="text-sm text-gray-500"
			classes={{ link: 'text-gray-600 underline hover:text-primary-700' }}
		/>
	</div>
</Footer>
