<script lang="ts">
	import { resolve } from '$app/paths';
	import { Footer, FooterCopyright, FooterLink, FooterLinkGroup } from 'flowbite-svelte';
	import { TagSolid } from 'flowbite-svelte-icons';
	import { translationStore } from '$lib/i18n';

	const currentYear = new Date().getFullYear();
</script>

<Footer class="border-t border-gray-200 bg-white">
	<div class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
		<div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
			<a href={resolve('/')} class="flex w-fit items-center gap-2">
				<span
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white"
				>
					<TagSolid class="h-5 w-5 -rotate-90" />
				</span>
				<span class="text-lg font-bold text-gray-900">{$translationStore.common.appName}</span>
			</a>

			<FooterLinkGroup class="flex flex-wrap gap-x-5 gap-y-2">
				<FooterLink
					href="#"
					liClass="list-none"
					aClass="text-sm font-medium text-gray-500 hover:text-primary-600"
				>
					{$translationStore.footer.terms}
				</FooterLink>
				<FooterLink
					href="#"
					liClass="list-none"
					aClass="text-sm font-medium text-gray-500 hover:text-primary-600"
				>
					{$translationStore.footer.privacy}
				</FooterLink>
				<FooterLink
					href="#"
					liClass="list-none"
					aClass="text-sm font-medium text-gray-500 hover:text-primary-600"
				>
					{$translationStore.footer.contact}
				</FooterLink>
			</FooterLinkGroup>
		</div>

		<hr class="my-5 border-gray-200" />

		<FooterCopyright
			href={resolve('/')}
			by={$translationStore.common.appName}
			year={currentYear}
			copyrightMessage={$translationStore.footer.rights}
			spanClass="text-sm text-gray-500"
			aClass="text-gray-600 hover:text-primary-600"
		/>
	</div>
</Footer>
