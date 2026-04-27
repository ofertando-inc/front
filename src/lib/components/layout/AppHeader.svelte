<script lang="ts">
	import { page } from '$app/state';
	import { authStore } from '$lib/stores/auth';
	import { localeStore, SUPPORTED_LOCALES, translationStore, type Locale } from '$lib/i18n';
	import {
		Avatar,
		Button,
		Dropdown,
		DropdownDivider,
		DropdownItem,
		NavBrand,
		NavHamburger,
		NavLi,
		NavUl,
		Navbar,
		Select
	} from 'flowbite-svelte';

	function handleLogout() {
		authStore.logout();
	}

	function handleLocaleChange(event: Event) {
		const target = event.currentTarget as HTMLSelectElement;
		localeStore.set(target.value as Locale);
	}
</script>

<Navbar class="border-b border-orange-100 bg-white/90 px-4 py-3 backdrop-blur">
	{#snippet children({ hidden, toggle })}
		<NavBrand href="/" class="gap-3">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-lg font-bold text-white"
			>
				O
			</div>
			<div>
				<p class="text-lg font-semibold text-slate-900">{$translationStore.common.appName}</p>
				<p class="text-xs uppercase tracking-[0.2em] text-slate-500">Frontend MVP</p>
			</div>
		</NavBrand>

		<div class="flex items-center gap-2 lg:order-2">
			<div class="hidden min-w-32 sm:block">
				<Select onchange={handleLocaleChange} value={$localeStore}>
					{#each SUPPORTED_LOCALES as locale}
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
				<Button href="/profile" color="light" class="hidden sm:inline-flex"
					>{$translationStore.common.profile}</Button
				>
				<Avatar id="user-menu" class="cursor-pointer" rounded />
					<Dropdown triggeredBy="#user-menu">
						<div class="px-4 py-3 text-sm">
							<p class="font-medium text-slate-900">{$authStore.user.username}</p>
							<p class="truncate text-slate-500">{$authStore.user.email}</p>
						</div>
						<DropdownItem href="/profile">{$translationStore.common.profile}</DropdownItem>
						<DropdownDivider />
						<DropdownItem onclick={handleLogout}>{$translationStore.common.logout}</DropdownItem>
					</Dropdown>
				{:else}
					<Button href="/login" color="light">{$translationStore.common.login}</Button>
					<Button href="/register">{$translationStore.common.register}</Button>
				{/if}

				<NavHamburger onclick={toggle} class="lg:hidden" />
			</div>

			<NavUl {hidden} class="mt-4 gap-2 lg:order-1 lg:mt-0 lg:flex">
				<NavLi href="/" active={page.url.pathname === '/'}>Home</NavLi>
			</NavUl>
	{/snippet}
</Navbar>
