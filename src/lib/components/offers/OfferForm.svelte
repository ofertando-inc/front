<script lang="ts">
	import { Button, Card, Checkbox, Input, Label, Select, Textarea } from 'flowbite-svelte';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { translationStore } from '$lib/i18n';
	import { categoryLabel } from '$lib/offers/categoryLabel';
	import { localInputToUtcIso, utcIsoToLocalInput } from '$lib/offers/dates';
	import { OFFER_NATURES, type Category } from '$lib/types/offer';
	import type { CreateOfferFormData } from '$lib/validation/offerSchema';
	import AddressCombobox from './AddressCombobox.svelte';
	import CityCombobox from './CityCombobox.svelte';
	import LocationMapPicker from './LocationMapPicker.svelte';
	import MerchantCombobox from './MerchantCombobox.svelte';

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
		// Business official offers: the affiliated merchant is imposed, so the
		// combobox is replaced by a read-only field (the server drops the value
		// from the payload anyway).
		lockedMerchantName?: string;
	}

	let { formData, categories, labels, lockedMerchantName }: Props = $props();

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
			// The server action reshapes merchant*/location* into the nested DTO and
			// drops the location for online offers, so nothing else to rewrite here.
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

	// Switching to "online" clears the physical location so it isn't submitted for
	// an online-only deal (the address field is hidden in that mode anyway).
	function handleChannelChange() {
		if ($form.isOnline) {
			$form.locationId = undefined;
			$form.locationAddress = '';
			$form.locationCity = '';
			$form.locationRegion = '';
			$form.locationLatitude = undefined;
			$form.locationLongitude = undefined;
		}
	}

	// offerType is a free string on the backend; the form curates a list but must
	// still preserve a legacy/custom value when editing an older offer.
	let extraNature = $derived(
		$form.offerType && !OFFER_NATURES.includes($form.offerType as (typeof OFFER_NATURES)[number])
			? $form.offerType
			: null
	);

	type FieldName = keyof CreateOfferFormData;

	function resolveFieldError(field: FieldName): string | null {
		const rawErrors = $errors[field] as unknown;
		// Array fields (e.g. categoryIds) carry their list-level error under
		// `_errors`, while scalar fields carry a plain string array.
		let firstError: string | undefined;
		if (Array.isArray(rawErrors)) {
			firstError = rawErrors[0];
		} else if (rawErrors && typeof rawErrors === 'object') {
			const nested = (rawErrors as { _errors?: unknown })._errors;
			if (Array.isArray(nested)) firstError = nested[0];
		}

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
		<form method="POST" use:enhance class="flex flex-col gap-6 p-5 sm:p-7">
			{#if globalErrors.length > 0}
				<div
					class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
					role="alert"
				>
					{#each globalErrors as globalError (globalError)}
						<p>{globalError}</p>
					{/each}
				</div>
			{/if}

			<!-- The offer type drives the whole form, so it comes first and on its own;
			     the rest stays hidden until a type is chosen. -->
			<div class="max-w-sm space-y-2">
				<Label for="offerType" class="text-sm font-medium text-gray-700"
					>{$translationStore.createDeal.offerTypeLabel} *</Label
				>
				<Select
					id="offerType"
					name="offerType"
					bind:value={$form.offerType}
					placeholder={$translationStore.createDeal.offerTypePlaceholder}
					required
					aria-invalid={resolveFieldError('offerType') ? 'true' : undefined}
					color={resolveFieldError('offerType') ? 'red' : undefined}
					class={resolveFieldError('offerType') ? fieldErrorClass : fieldClass}
				>
					{#if extraNature}
						<option value={extraNature}>{extraNature}</option>
					{/if}
					{#each OFFER_NATURES as nature (nature)}
						<option value={nature}>{$translationStore.createDeal.offerNature[nature]}</option>
					{/each}
				</Select>
				{#if resolveFieldError('offerType')}
					<p class="text-sm text-red-600">{resolveFieldError('offerType')}</p>
				{/if}
			</div>

			<div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
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
					<div class="space-y-1 rounded-2xl border border-gray-200 bg-white px-4 py-3">
						<Checkbox name="isOnline" bind:checked={$form.isOnline} onchange={handleChannelChange}>
							<span class="text-sm font-medium text-gray-700"
								>{$translationStore.createDeal.isOnlineLabel}</span
							>
						</Checkbox>
						<p class="text-sm text-gray-500">{$translationStore.createDeal.isOnlineHint}</p>
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
							>{$translationStore.createDeal.externalUrlLabel}{$form.isOnline ? ' *' : ''}</Label
						>
						<Input
							id="externalUrl"
							name="externalUrl"
							type="url"
							bind:value={$form.externalUrl}
							placeholder={$translationStore.createDeal.externalUrlPlaceholder}
							required={$form.isOnline}
							aria-invalid={resolveFieldError('externalUrl') ? 'true' : undefined}
							color={resolveFieldError('externalUrl') ? 'red' : undefined}
							class={resolveFieldError('externalUrl') ? fieldErrorClass : fieldClass}
						/>
						<p class="text-sm text-gray-500">
							{$form.isOnline
								? $translationStore.createDeal.externalUrlHintOnline
								: $translationStore.createDeal.externalUrlHint}
						</p>
						{#if resolveFieldError('externalUrl')}
							<p class="text-sm text-red-600">{resolveFieldError('externalUrl')}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="merchantName" class="text-sm font-medium text-gray-700"
							>{$translationStore.createDeal.merchantLabel} *</Label
						>
						{#if lockedMerchantName}
							<Input
								id="merchantName"
								type="text"
								value={lockedMerchantName}
								disabled
								class="rounded-lg border-gray-300 bg-gray-100 text-gray-700"
							/>
							<input type="hidden" name="merchantName" value={lockedMerchantName} />
							<p class="text-sm text-gray-500">
								{$translationStore.createDeal.merchantLockedHint}
							</p>
						{:else}
							<MerchantCombobox
								id="merchantName"
								name="merchantName"
								linkName="merchantId"
								bind:merchantName={$form.merchantName}
								bind:merchantId={$form.merchantId}
								placeholder={$translationStore.createDeal.merchantPlaceholder}
								required
								invalid={Boolean(resolveFieldError('merchantName'))}
							/>
							{#if resolveFieldError('merchantName')}
								<p class="text-sm text-red-600">{resolveFieldError('merchantName')}</p>
							{/if}
						{/if}
					</div>

					{#if !$form.isOnline}
						<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
							<div class="space-y-2">
								<Label for="locationCity" class="text-sm font-medium text-gray-700"
									>{$translationStore.createDeal.cityLabel} *</Label
								>
								<CityCombobox
									id="locationCity"
									name="locationCity"
									bind:value={$form.locationCity}
									placeholder={$translationStore.createDeal.cityPlaceholder}
									required
									invalid={Boolean(resolveFieldError('locationCity'))}
								/>
								{#if resolveFieldError('locationCity')}
									<p class="text-sm text-red-600">{resolveFieldError('locationCity')}</p>
								{/if}
							</div>

							{#if $form.locationCity}
								<div class="space-y-2">
									<Label for="locationAddress" class="text-sm font-medium text-gray-700"
										>{$translationStore.createDeal.addressLabel} *</Label
									>
									<AddressCombobox
										id="locationAddress"
										name="locationAddress"
										bind:address={$form.locationAddress}
										bind:region={$form.locationRegion}
										bind:latitude={$form.locationLatitude}
										bind:longitude={$form.locationLongitude}
										cityHint={$form.locationCity ?? ''}
										required
										invalid={Boolean(resolveFieldError('locationAddress'))}
									/>
									<p class="text-sm text-gray-500">{$translationStore.createDeal.addressHint}</p>
									{#if resolveFieldError('locationAddress')}
										<p class="text-sm text-red-600">{resolveFieldError('locationAddress')}</p>
									{/if}
								</div>
							{/if}
						</div>

						{#if $form.locationAddress}
							<div class="space-y-2">
								<LocationMapPicker
									bind:latitude={$form.locationLatitude}
									bind:longitude={$form.locationLongitude}
									onLocate={(place) => ($form.locationRegion = place.region)}
								/>
								<p class="text-sm text-gray-500">{$translationStore.createDeal.mapHint}</p>
							</div>
						{/if}
					{/if}

					{#if $form.isOnline || $form.locationCity}
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
					{/if}
				</div>
			</div>
		</form>
	</Card>
</section>
