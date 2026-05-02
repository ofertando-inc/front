<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { authStore } from '$lib/stores/auth';
	import { localeStore, SUPPORTED_LOCALES, translationStore, type Locale } from '$lib/i18n';
	import {
		Avatar,
		Button,
		Dropdown,
		DropdownDivider,
		DropdownItem,
		Input,
		NavBrand,
		NavHamburger,
		NavLi,
		NavUl,
		Navbar,
		Select
	} from 'flowbite-svelte';
	import { SearchOutline, TagSolid } from 'flowbite-svelte-icons';

	async function handleLogout() {
		authStore.logout();
		await goto(resolve('/'));
	}

	function handleLocaleChange(event: Event) {
		const target = event.currentTarget as HTMLSelectElement;
		localeStore.set(target.value as Locale);
	}
</script>

<Navbar class="sticky top-0 z-50 border-b border-gray-200 bg-white px-4 py-3">
	{#snippet children({ hidden, toggle })}
		<NavBrand href={resolve('/')} class="gap-2">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white transition-colors hover:bg-primary-600"
			>
				<TagSolid class="h-6 w-6 -rotate-90" />
			</div>
			<span
				class="bg-linear-to-r from-primary-600 to-primary-500 bg-clip-text text-2xl font-bold text-transparent"
			>
				{$translationStore.common.appName}
			</span>
		</NavBrand>

		<div class="flex items-center gap-2 md:order-2">
			<div class="hidden min-w-32 sm:block">
				<Select onchange={handleLocaleChange} value={$localeStore}>
					{#each SUPPORTED_LOCALES as locale (locale)}
						<option value={locale}>
							{locale === 'es'
								? $translationStore.common.spanish
								: locale === 'en'
									? $translationStore.common.english
									: $translationStore.common.french}
						</option>
					{/each}
				</Select>
			</div>

			{#if $authStore.isAuthenticated && $authStore.user}
				<Button href={resolve('/profile')} color="light" class="hidden rounded-full sm:inline-flex"
					>{$translationStore.common.profile}</Button
				>
				<Avatar id="user-menu" class="cursor-pointer" cornerStyle="rounded" />
				<Dropdown triggeredBy="#user-menu">
					<div class="px-4 py-3 text-sm">
						<p class="font-medium text-slate-900">{$authStore.user.username}</p>
						<p class="truncate text-slate-500">{$authStore.user.email}</p>
					</div>
					<DropdownItem href={resolve('/profile')} liClass="list-none"
						>{$translationStore.common.profile}</DropdownItem
					>
					<DropdownDivider />
					<DropdownItem onclick={handleLogout} liClass="list-none"
						>{$translationStore.common.logout}</DropdownItem
					>
				</Dropdown>
			{:else}
				<Button href={resolve('/login')} color="light" class="hidden rounded-full sm:inline-flex"
					>{$translationStore.common.login}</Button
				>
				<Button href={resolve('/register')} class="rounded-full"
					>{$translationStore.common.register}</Button
				>
			{/if}

			<NavHamburger onclick={toggle} class="md:hidden" />
		</div>

		<div class="hidden flex-1 items-center justify-center gap-8 px-8 md:order-1 md:flex">
			<div class="w-full max-w-md">
				<Input
					type="search"
					placeholder={$translationStore.common.searchPlaceholder}
					class="rounded-full border-gray-300 bg-gray-50 pl-10 focus:border-primary-500 focus:ring-primary-500"
				>
					{#snippet left()}
						<SearchOutline class="h-5 w-5 text-gray-400" />
					{/snippet}
				</Input>
			</div>

			<NavUl activeUrl={page.url.pathname} class="gap-2">
				<NavLi href={resolve('/')}>{$translationStore.common.home}</NavLi>
			</NavUl>
		</div>

		<NavUl {hidden} activeUrl={page.url.pathname} class="mt-4 gap-2 md:hidden">
			<li class="mb-3 list-none">
				<Input
					type="search"
					placeholder={$translationStore.common.searchPlaceholder}
					class="rounded-lg border-gray-300 bg-gray-50 pl-10 focus:border-primary-500 focus:ring-primary-500"
				>
					{#snippet left()}
						<SearchOutline class="h-5 w-5 text-gray-400" />
					{/snippet}
				</Input>
			</li>
			<NavLi href={resolve('/')}>{$translationStore.common.home}</NavLi>
			{#if !$authStore.isAuthenticated}
				<NavLi href={resolve('/login')}>{$translationStore.common.login}</NavLi>
			{/if}
		</NavUl>
	{/snippet}
</Navbar>
