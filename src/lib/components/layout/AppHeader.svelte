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
		await authStore.logout();
		await goto(resolve('/'));
	}

	function handleLocaleChange(event: Event) {
		const target = event.currentTarget as HTMLSelectElement;
		localeStore.set(target.value as Locale);
	}
</script>

<Navbar
	class="sticky top-0 z-50 border-b border-orange-100 bg-[#fffbf5]/85 px-2 py-2.5 backdrop-blur-md sm:px-4"
>
	{#snippet children({ hidden, toggle })}
		<NavBrand href={resolve('/')} class="gap-2.5">
			<div
				class="flex h-9 w-9 shrink-0 -rotate-3 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-sm shadow-primary-500/30 transition-transform hover:rotate-0 sm:h-10 sm:w-10"
			>
				<TagSolid class="h-5 w-5 -rotate-90 sm:h-6 sm:w-6" />
			</div>
			<span class="font-display text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">
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
				<Button href={resolve('/create-deal')} class="hidden rounded-full px-4 md:inline-flex">
					<TagSolid class="mr-2 h-4 w-4 -rotate-90" />
					{$translationStore.profile.publishOffer}
				</Button>
				<Avatar id="user-menu" class="cursor-pointer" cornerStyle="rounded" />
				<Dropdown triggeredBy="#user-menu">
					<div class="px-4 py-3 text-sm">
						<p class="font-medium text-slate-900">{$authStore.user.username}</p>
						<p class="truncate text-slate-500">{$authStore.user.email}</p>
					</div>
					<DropdownItem href={resolve('/profile')} classes={{ li: 'list-none' }}
						>{$translationStore.common.profile}</DropdownItem
					>
					{#if $authStore.user.role === 'ADMIN'}
						<DropdownItem href={resolve('/admin')} classes={{ li: 'list-none' }}
							>{$translationStore.common.admin}</DropdownItem
						>
					{/if}
					<DropdownDivider />
					<DropdownItem onclick={handleLogout} classes={{ li: 'list-none' }}
						>{$translationStore.common.logout}</DropdownItem
					>
				</Dropdown>
			{:else}
				<Button href={resolve('/login')} color="light" class="hidden rounded-full sm:inline-flex"
					>{$translationStore.common.login}</Button
				>
				<Button href={resolve('/register')} class="hidden rounded-full sm:inline-flex"
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
					class="rounded-full border-orange-100 bg-[#fffaf3] pl-10 placeholder:text-gray-400 focus:border-primary-500 focus:ring-primary-500"
				>
					{#snippet left()}
						<SearchOutline class="h-5 w-5 text-primary-400" />
					{/snippet}
				</Input>
			</div>

			<NavUl activeUrl={page.url.pathname} class="gap-2">
				<NavLi href={resolve('/')}>{$translationStore.common.home}</NavLi>
			</NavUl>
		</div>

		<NavUl {hidden} activeUrl={page.url.pathname} class="mt-3 gap-2 md:hidden">
			<li class="mb-3 list-none">
				<Input
					type="search"
					placeholder={$translationStore.common.searchPlaceholder}
					class="rounded-lg border-orange-100 bg-[#fffaf3] pl-10 placeholder:text-gray-400 focus:border-primary-500 focus:ring-primary-500"
				>
					{#snippet left()}
						<SearchOutline class="h-5 w-5 text-primary-400" />
					{/snippet}
				</Input>
			</li>
			<li class="list-none px-3 pb-2">
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
			</li>
			<NavLi href={resolve('/')}>{$translationStore.common.home}</NavLi>
			{#if $authStore.isAuthenticated}
				<li class="list-none px-3 pt-2">
					<Button href={resolve('/create-deal')} class="w-full justify-center rounded-full">
						<TagSolid class="mr-2 h-4 w-4 -rotate-90" />
						{$translationStore.profile.publishOffer}
					</Button>
				</li>
				<NavLi href={resolve('/profile')}>{$translationStore.common.profile}</NavLi>
				{#if $authStore.user?.role === 'ADMIN'}
					<NavLi href={resolve('/admin')}>{$translationStore.common.admin}</NavLi>
				{/if}
				<li class="list-none px-3 pt-2">
					<Button color="light" class="w-full justify-center rounded-full" onclick={handleLogout}>
						{$translationStore.common.logout}
					</Button>
				</li>
			{:else}
				<li class="list-none px-3 pt-2">
					<div class="grid grid-cols-2 gap-2">
						<Button
							href={resolve('/login')}
							color="light"
							class="w-full justify-center rounded-full"
						>
							{$translationStore.common.login}
						</Button>
						<Button href={resolve('/register')} class="w-full justify-center rounded-full">
							{$translationStore.common.register}
						</Button>
					</div>
				</li>
			{/if}
		</NavUl>
	{/snippet}
</Navbar>
