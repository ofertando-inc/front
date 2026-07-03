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
	import { MoonOutline, SearchOutline, SunOutline, TagSolid } from 'flowbite-svelte-icons';
	import { themeStore } from '$lib/stores/theme';

	let searchTerm = $state('');

	function handleSearch(event: SubmitEvent) {
		event.preventDefault();
		const term = searchTerm.trim();
		const target = term ? `${resolve('/deals')}?q=${encodeURIComponent(term)}` : resolve('/deals');
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- query string appended to a resolved route
		void goto(target);
	}

	async function handleLogout() {
		await authStore.logout();
		await goto(resolve('/'));
	}

	function handleLocaleChange(event: Event) {
		const target = event.currentTarget as HTMLSelectElement;
		localeStore.set(target.value as Locale);
	}

	function toggleTheme() {
		themeStore.set($themeStore === 'dark' ? 'light' : 'dark');
	}
</script>

<Navbar
	class="sticky top-0 z-50 border-b border-orange-100 bg-[#fffbf5]/85 px-2 py-2.5 backdrop-blur-md sm:px-4 dark:bg-[#171310]/85"
>
	{#snippet children({ hidden, toggle })}
		<!-- Left: brand + primary nav -->
		<div class="flex items-center gap-2.5 md:order-1 md:gap-7">
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

			<NavUl activeUrl={page.url.pathname} class="hidden md:flex md:gap-1">
				<NavLi href={resolve('/')}>{$translationStore.common.home}</NavLi>
				<NavLi href={resolve('/deals')}>{$translationStore.common.explore}</NavLi>
			</NavUl>
		</div>

		<!-- Right: locale + actions -->
		<div class="flex items-center gap-2 md:order-3">
			<div class="hidden min-w-28 sm:block">
				<Select
					onchange={handleLocaleChange}
					value={$localeStore}
					size="sm"
					placeholder=""
					aria-label={$translationStore.common.languageLabel}
				>
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

			<button
				type="button"
				onclick={toggleTheme}
				aria-pressed={$themeStore === 'dark'}
				aria-label={$themeStore === 'dark'
					? $translationStore.common.lightMode
					: $translationStore.common.darkMode}
				class="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
			>
				{#if $themeStore === 'dark'}
					<SunOutline class="h-5 w-5" />
				{:else}
					<MoonOutline class="h-5 w-5" />
				{/if}
			</button>

			{#if $authStore.isAuthenticated && $authStore.user}
				<Button href={resolve('/create-deal')} class="hidden rounded-full px-4 md:inline-flex">
					<TagSolid class="mr-2 h-4 w-4 -rotate-90" />
					{$translationStore.profile.publishOffer}
				</Button>
				<!-- A real button so the menu is reachable and announced by keyboard/AT. -->
				<button
					id="user-menu"
					type="button"
					aria-label={$translationStore.common.userMenu}
					aria-haspopup="menu"
					class="rounded-lg"
				>
					<Avatar cornerStyle="rounded" role="presentation" />
				</button>
				<Dropdown triggeredBy="#user-menu">
					<div class="px-4 py-3 text-sm">
						<p class="font-medium text-slate-900">{$authStore.user.username}</p>
						<p class="truncate text-slate-500">{$authStore.user.email}</p>
					</div>
					<DropdownItem href={resolve('/profile')} classes={{ li: 'list-none' }}
						>{$translationStore.common.profile}</DropdownItem
					>
					{#if $authStore.user.accountType === 'BUSINESS'}
						<DropdownItem href={resolve('/business')} classes={{ li: 'list-none' }}
							>{$translationStore.common.businessSpace}</DropdownItem
						>
					{/if}
					{#if $authStore.user.role === 'ADMIN' || $authStore.user.role === 'ROOT'}
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

		<!-- Center: search -->
		<div class="hidden flex-1 md:order-2 md:flex md:px-6">
			<form class="mx-auto w-full max-w-md" onsubmit={handleSearch} role="search">
				<Input
					type="search"
					bind:value={searchTerm}
					placeholder={$translationStore.common.searchPlaceholder}
					class="rounded-full border-orange-100 bg-[#fffaf3] pl-10 placeholder:text-gray-400 focus:border-primary-500 focus:ring-primary-500 dark:bg-[#221d19] dark:text-gray-100"
				>
					{#snippet left()}
						<button
							type="submit"
							aria-label={$translationStore.common.search}
							class="pointer-events-auto -m-2 flex items-center rounded-full p-2 text-primary-400 transition-colors hover:text-primary-600"
						>
							<SearchOutline class="h-5 w-5" />
						</button>
					{/snippet}
				</Input>
			</form>
		</div>

		<!-- Mobile menu -->
		<NavUl {hidden} activeUrl={page.url.pathname} class="mt-3 space-y-1 md:hidden">
			<li class="mb-2 list-none">
				<form onsubmit={handleSearch} role="search">
					<Input
						type="search"
						bind:value={searchTerm}
						placeholder={$translationStore.common.searchPlaceholder}
						class="rounded-lg border-orange-100 bg-[#fffaf3] pl-10 placeholder:text-gray-400 focus:border-primary-500 focus:ring-primary-500 dark:bg-[#221d19] dark:text-gray-100"
					>
						{#snippet left()}
							<button
								type="submit"
								aria-label={$translationStore.common.search}
								class="pointer-events-auto -m-2 flex items-center rounded-full p-2 text-primary-400 transition-colors hover:text-primary-600"
							>
								<SearchOutline class="h-5 w-5" />
							</button>
						{/snippet}
					</Input>
				</form>
			</li>

			<NavLi href={resolve('/')}>{$translationStore.common.home}</NavLi>
			<NavLi href={resolve('/deals')}>{$translationStore.common.explore}</NavLi>

			{#if $authStore.isAuthenticated}
				<NavLi href={resolve('/profile')}>{$translationStore.common.profile}</NavLi>
				{#if $authStore.user?.accountType === 'BUSINESS'}
					<NavLi href={resolve('/business')}>{$translationStore.common.businessSpace}</NavLi>
				{/if}
				{#if $authStore.user?.role === 'ADMIN' || $authStore.user?.role === 'ROOT'}
					<NavLi href={resolve('/admin')}>{$translationStore.common.admin}</NavLi>
				{/if}
				<li class="mt-2 list-none border-t border-orange-100 px-3 pt-3">
					<Button href={resolve('/create-deal')} class="w-full justify-center rounded-full">
						<TagSolid class="mr-2 h-4 w-4 -rotate-90" />
						{$translationStore.profile.publishOffer}
					</Button>
				</li>
				<li class="list-none px-3 pt-2">
					<Button color="light" class="w-full justify-center rounded-full" onclick={handleLogout}>
						{$translationStore.common.logout}
					</Button>
				</li>
			{:else}
				<li class="mt-2 list-none border-t border-orange-100 px-3 pt-3">
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

			<li class="mt-2 list-none border-t border-orange-100 px-3 pt-3">
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
		</NavUl>
	{/snippet}
</Navbar>
