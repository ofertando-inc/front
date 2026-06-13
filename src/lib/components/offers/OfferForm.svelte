<script lang="ts">
	import { Button, Card, Input, Label, Select, Textarea } from 'flowbite-svelte';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { translationStore } from '$lib/i18n';
	import { categoryLabel } from '$lib/offers/categoryLabel';
	import { NATIONAL_CITY, normalizeCity } from '$lib/offers/cities';
	import { localInputToUtcIso, utcIsoToLocalInput } from '$lib/offers/dates';
	import type { Category } from '$lib/types/offer';
	import type { CreateOfferFormData } from '$lib/validation/offerSchema';
	import CityCombobox from './CityCombobox.svelte';
	import StoreCombobox from './StoreCombobox.svelte';

	export interface OfferFormLabels {
		heading: string;
		intro: string;
		submit: string;
		submitting: string;
		genericError: string;
		genericErrorKey: string;
	}

	interface Props {
		formData: SuperValidated<CreateOfferFormData>;
		categories: Category[];
		labels: OfferFormLabels;
	}

	let { formData, categories, labels }: Props = $props();

	const DATE_FIELDS = ['startDate', 'endDate'] as const;

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, submitting } = superForm(formData, {
		resetForm: false,
		onSubmit({ formData: outgoing }) {
			// Convert the naive datetime-local picker values to ISO 8601 UTC in the
			// browser (correct timezone + DST), never on the SvelteKit server which
			// runs in UTC. Only the outgoing payload is rewritten; the visible
			// inputs keep showing local time.
			for (const field of DATE_FIELDS) {
				const value = outgoing.get(field);
				if (typeof value === 'string') {
					outgoing.set(field, localInputToUtcIso(value));
				}
			}

			// Local offers ship the canonical city name so the backend always
			// stores a uniform value (e.g. "medellin" -> "Medellín"); an unknown
			// city is left as-is and rejected by the schema. Online offers have no
			// city field, so they always ship the "Nacional" sentinel.
			if (outgoing.get('offerType') === 'local') {
				const canonical = normalizeCity(String(outgoing.get('city') ?? ''));
				if (canonical) outgoing.set('city', canonical);
			} else {
				outgoing.set('city', NATIONAL_CITY);
			}
		},
		onUpdated() {
			// On a validation failure the server echoes the UTC values back into the
			// form store; re-localize them so the datetime-local pickers can display
			// them again (no-op when the values are already local).
			form.update(
				(current) => ({
					...current,
					startDate: utcIsoToLocalInput(current.startDate),
					endDate: utcIsoToLocalInput(current.endDate)
				}),
				{ taint: false }
			);
		}
	});

	// Online offers have no city field — they ship the "Nacional" sentinel.
	// Switching to local clears it so the user must pick a real city.
	function handleOfferTypeChange() {
		if ($form.offerType === 'online') {
			$form.city = NATIONAL_CITY;
		} else if ($form.city === NATIONAL_CITY) {
			$form.city = '';
		}
	}

	// Picking/creating a store syncs the free-text city for local offers (online
	// keeps its "Nacional" sentinel). Store name + id are bound by the combobox.
	function handleStorePicked(store: { name: string; city: string }) {
		if ($form.offerType === 'local') $form.city = store.city;
	}

	type FieldName = keyof CreateOfferFormData;

	function resolveFieldError(field: FieldName): string | null {
		const rawErrors = $errors[field];
		const firstError = Array.isArray(rawErrors) ? rawErrors[0] : undefined;

		if (!firstError) return null;

		const fieldMessages = $translationStore.validation.fields[field];
		return (
			fieldMessages?.[firstError] ??
			$translationStore.validation.system[firstError] ??
			$translationStore.validation.fallback
		);
	}

	function resolveGlobalError(errorKey: string): string {
		if (errorKey === labels.genericErrorKey) {
			return labels.genericError;
		}

		return (
			$translationStore.errors[errorKey as keyof typeof $translationStore.errors] ??
			$translationStore.validation.system[errorKey] ??
			$translationStore.errors.fallback
		);
	}

	function getGlobalErrors(): string[] {
		const formErrors = $errors as typeof $errors & { _errors?: string[] };
		return (formErrors._errors ?? []).map(resolveGlobalError);
	}

	let globalErrors = $derived(getGlobalErrors());

	const fieldClass =
		'rounded-lg border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-primary-500';
	const fieldErrorClass =
		'rounded-lg border-red-400 bg-white text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500';
</script>

<section class="mx-auto flex w-full max-w-5xl flex-col gap-6 py-6 sm:py-10">
	<div class="max-w-3xl space-y-3 px-1">
		<p class="text-sm font-semibold tracking-[0.2em] text-primary-600 uppercase">
			{$translationStore.common.appName}
		</p>
		<h1 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
			{labels.heading}
		</h1>
		<p class="max-w-2xl text-base leading-7 text-gray-600">
			{labels.intro}
		</p>
	</div>

	<Card
		class="max-w-full! overflow-hidden rounded-3xl border border-gray-200 bg-white p-0 shadow-sm"
	>
		<form method="POST" use:enhance class="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.1fr_0.9fr]">
			{#if globalErrors.length > 0}
				<div
					class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 lg:col-span-2"
					role="alert"
				>
					{#each globalErrors as globalError (globalError)}
						<p>{globalError}</p>
					{/each}
				</div>
			{/if}

			<div class="space-y-5">
				<div class="space-y-2">
					<Label for="title" class="text-sm font-medium text-gray-700"
						>{$translationStore.createDeal.titleLabel} *</Label
					>
					<Input
						id="title"
						name="title"
						type="text"
						bind:value={$form.title}
						placeholder={$translationStore.createDeal.titlePlaceholder}
						required
						maxlength={200}
						aria-invalid={resolveFieldError('title') ? 'true' : undefined}
						color={resolveFieldError('title') ? 'red' : undefined}
						class={resolveFieldError('title') ? fieldErrorClass : fieldClass}
					/>
					{#if resolveFieldError('title')}
						<p class="text-sm text-red-600">{resolveFieldError('title')}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="description" class="text-sm font-medium text-gray-700"
						>{$translationStore.createDeal.descriptionLabel} *</Label
					>
					<Textarea
						id="description"
						name="description"
						rows={12}
						bind:value={$form.description}
						placeholder={$translationStore.createDeal.descriptionPlaceholder}
						required
						maxlength={5000}
						aria-invalid={resolveFieldError('description') ? 'true' : undefined}
						color={resolveFieldError('description') ? 'red' : undefined}
						class="{resolveFieldError('description')
							? fieldErrorClass
							: fieldClass} block min-h-80 w-full resize-y leading-relaxed"
					/>
					{#if resolveFieldError('description')}
						<p class="text-sm text-red-600">{resolveFieldError('description')}</p>
					{/if}
				</div>
			</div>

			<div class="space-y-5 rounded-3xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
				<div class="space-y-2">
					<Label for="offerType" class="text-sm font-medium text-gray-700"
						>{$translationStore.createDeal.offerTypeLabel} *</Label
					>
					<Select
						id="offerType"
						name="offerType"
						bind:value={$form.offerType}
						onchange={handleOfferTypeChange}
						required
						aria-invalid={resolveFieldError('offerType') ? 'true' : undefined}
						color={resolveFieldError('offerType') ? 'red' : undefined}
						class={resolveFieldError('offerType') ? fieldErrorClass : fieldClass}
					>
						<option value="online">{$translationStore.createDeal.offerTypeOnline}</option>
						<option value="local">{$translationStore.createDeal.offerTypeLocal}</option>
					</Select>
					{#if resolveFieldError('offerType')}
						<p class="text-sm text-red-600">{resolveFieldError('offerType')}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label class="text-sm font-medium text-gray-700"
						>{$translationStore.createDeal.categoriesLabel} *</Label
					>
					<div class="flex flex-wrap gap-2">
						{#each categories as category (category.id)}
							<label class="cursor-pointer">
								<input
									type="checkbox"
									name="categoryIds"
									value={category.id}
									bind:group={$form.categoryIds}
									class="sr-only"
								/>
								<span
									class="inline-block rounded-full border px-3 py-1.5 text-sm font-medium transition-colors {$form.categoryIds.includes(
										category.id
									)
										? 'border-primary-500 bg-primary-500 text-white'
										: 'border-gray-300 bg-white text-gray-600 hover:border-primary-300'}"
								>
									{categoryLabel($translationStore, category.slug, category.name)}
								</span>
							</label>
						{/each}
					</div>
					{#if resolveFieldError('categoryIds')}
						<p class="text-sm text-red-600">{resolveFieldError('categoryIds')}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="externalUrl" class="text-sm font-medium text-gray-700"
						>{$translationStore.createDeal.externalUrlLabel}</Label
					>
					<Input
						id="externalUrl"
						name="externalUrl"
						type="url"
						bind:value={$form.externalUrl}
						placeholder={$translationStore.createDeal.externalUrlPlaceholder}
						aria-invalid={resolveFieldError('externalUrl') ? 'true' : undefined}
						color={resolveFieldError('externalUrl') ? 'red' : undefined}
						class={resolveFieldError('externalUrl') ? fieldErrorClass : fieldClass}
					/>
					<p class="text-sm text-gray-500">{$translationStore.createDeal.externalUrlHint}</p>
					{#if resolveFieldError('externalUrl')}
						<p class="text-sm text-red-600">{resolveFieldError('externalUrl')}</p>
					{/if}
				</div>

				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
					<div class="space-y-2">
						<Label for="storeName" class="text-sm font-medium text-gray-700"
							>{$translationStore.createDeal.storeNameLabel} *</Label
						>
						<StoreCombobox
							id="storeName"
							name="storeName"
							linkName="storeId"
							bind:storeName={$form.storeName}
							bind:storeId={$form.storeId}
							placeholder={$translationStore.createDeal.storeNamePlaceholder}
							required
							invalid={Boolean(resolveFieldError('storeName'))}
							onSelect={handleStorePicked}
						/>
						{#if resolveFieldError('storeName')}
							<p class="text-sm text-red-600">{resolveFieldError('storeName')}</p>
						{/if}
					</div>

					{#if $form.offerType === 'local'}
						<div class="space-y-2">
							<Label for="city" class="text-sm font-medium text-gray-700"
								>{$translationStore.createDeal.cityLabel} *</Label
							>
							<CityCombobox
								id="city"
								name="city"
								bind:value={$form.city}
								placeholder={$translationStore.createDeal.cityPlaceholder}
								required
								invalid={Boolean(resolveFieldError('city'))}
							/>
							{#if resolveFieldError('city')}
								<p class="text-sm text-red-600">{resolveFieldError('city')}</p>
							{/if}
						</div>
					{/if}
				</div>

				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
					<div class="space-y-2">
						<Label for="startDate" class="text-sm font-medium text-gray-700"
							>{$translationStore.createDeal.startDateLabel} *</Label
						>
						<Input
							id="startDate"
							name="startDate"
							type="datetime-local"
							bind:value={$form.startDate}
							required
							aria-invalid={resolveFieldError('startDate') ? 'true' : undefined}
							color={resolveFieldError('startDate') ? 'red' : undefined}
							class={resolveFieldError('startDate') ? fieldErrorClass : fieldClass}
						/>
						{#if resolveFieldError('startDate')}
							<p class="text-sm text-red-600">{resolveFieldError('startDate')}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="endDate" class="text-sm font-medium text-gray-700"
							>{$translationStore.createDeal.endDateLabel} *</Label
						>
						<Input
							id="endDate"
							name="endDate"
							type="datetime-local"
							bind:value={$form.endDate}
							required
							aria-invalid={resolveFieldError('endDate') ? 'true' : undefined}
							color={resolveFieldError('endDate') ? 'red' : undefined}
							class={resolveFieldError('endDate') ? fieldErrorClass : fieldClass}
						/>
						{#if resolveFieldError('endDate')}
							<p class="text-sm text-red-600">{resolveFieldError('endDate')}</p>
						{/if}
					</div>
				</div>

				<div class="space-y-4 pt-2">
					<p class="text-sm text-gray-500">{$translationStore.createDeal.requiredHint}</p>
					<Button type="submit" size="lg" class="w-full" disabled={$submitting}>
						{$submitting ? labels.submitting : labels.submit}
					</Button>
				</div>
			</div>
		</form>
	</Card>
</section>
