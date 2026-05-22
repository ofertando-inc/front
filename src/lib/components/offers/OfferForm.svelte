<script lang="ts">
	import { Button, Card, Input, Label, Select, Textarea } from 'flowbite-svelte';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { translationStore } from '$lib/i18n';
	import type { CreateOfferFormData } from '$lib/validation/offerSchema';

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
		labels: OfferFormLabels;
	}

	let { formData, labels }: Props = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, submitting } = superForm(formData, {
		resetForm: false
	});

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
</script>

<section class="mx-auto flex w-full max-w-5xl flex-col gap-6 py-6 sm:py-10">
	<div class="max-w-3xl space-y-3 px-1">
		<p class="text-sm font-semibold tracking-[0.2em] text-primary-600 uppercase">
			{$translationStore.common.appName}
		</p>
		<h1 class="text-3xl font-semibold text-slate-950 sm:text-4xl">
			{labels.heading}
		</h1>
		<p class="max-w-2xl text-base leading-7 text-slate-600">
			{labels.intro}
		</p>
	</div>

	<Card
		class="max-w-full! overflow-hidden rounded-3xl border border-slate-200 bg-white p-0 shadow-sm"
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
					<Label for="title">{$translationStore.createDeal.titleLabel} *</Label>
					<Input
						id="title"
						name="title"
						type="text"
						bind:value={$form.title}
						placeholder={$translationStore.createDeal.titlePlaceholder}
						required
						maxlength={200}
						aria-invalid={resolveFieldError('title') ? 'true' : undefined}
					/>
					{#if resolveFieldError('title')}
						<p class="text-sm text-red-600">{resolveFieldError('title')}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="description">{$translationStore.createDeal.descriptionLabel} *</Label>
					<Textarea
						id="description"
						name="description"
						rows={8}
						bind:value={$form.description}
						placeholder={$translationStore.createDeal.descriptionPlaceholder}
						required
						maxlength={5000}
						aria-invalid={resolveFieldError('description') ? 'true' : undefined}
					/>
					{#if resolveFieldError('description')}
						<p class="text-sm text-red-600">{resolveFieldError('description')}</p>
					{/if}
				</div>
			</div>

			<div class="space-y-5 rounded-3xl bg-slate-50 p-4 sm:p-5">
				<div class="space-y-2">
					<Label for="offerType">{$translationStore.createDeal.offerTypeLabel} *</Label>
					<Select
						id="offerType"
						name="offerType"
						bind:value={$form.offerType}
						required
						aria-invalid={resolveFieldError('offerType') ? 'true' : undefined}
					>
						<option value="online">{$translationStore.createDeal.offerTypeOnline}</option>
						<option value="local">{$translationStore.createDeal.offerTypeLocal}</option>
					</Select>
					{#if resolveFieldError('offerType')}
						<p class="text-sm text-red-600">{resolveFieldError('offerType')}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="externalUrl">{$translationStore.createDeal.externalUrlLabel}</Label>
					<Input
						id="externalUrl"
						name="externalUrl"
						type="url"
						bind:value={$form.externalUrl}
						placeholder={$translationStore.createDeal.externalUrlPlaceholder}
						aria-invalid={resolveFieldError('externalUrl') ? 'true' : undefined}
					/>
					<p class="text-sm text-slate-500">{$translationStore.createDeal.externalUrlHint}</p>
					{#if resolveFieldError('externalUrl')}
						<p class="text-sm text-red-600">{resolveFieldError('externalUrl')}</p>
					{/if}
				</div>

				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
					<div class="space-y-2">
						<Label for="storeName">{$translationStore.createDeal.storeNameLabel} *</Label>
						<Input
							id="storeName"
							name="storeName"
							type="text"
							bind:value={$form.storeName}
							placeholder={$translationStore.createDeal.storeNamePlaceholder}
							required
							maxlength={100}
							aria-invalid={resolveFieldError('storeName') ? 'true' : undefined}
						/>
						{#if resolveFieldError('storeName')}
							<p class="text-sm text-red-600">{resolveFieldError('storeName')}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="city">{$translationStore.createDeal.cityLabel} *</Label>
						<Input
							id="city"
							name="city"
							type="text"
							bind:value={$form.city}
							placeholder={$translationStore.createDeal.cityPlaceholder}
							required
							maxlength={100}
							aria-invalid={resolveFieldError('city') ? 'true' : undefined}
						/>
						{#if resolveFieldError('city')}
							<p class="text-sm text-red-600">{resolveFieldError('city')}</p>
						{/if}
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
					<div class="space-y-2">
						<Label for="startDate">{$translationStore.createDeal.startDateLabel} *</Label>
						<Input
							id="startDate"
							name="startDate"
							type="datetime-local"
							bind:value={$form.startDate}
							required
							aria-invalid={resolveFieldError('startDate') ? 'true' : undefined}
						/>
						{#if resolveFieldError('startDate')}
							<p class="text-sm text-red-600">{resolveFieldError('startDate')}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="endDate">{$translationStore.createDeal.endDateLabel} *</Label>
						<Input
							id="endDate"
							name="endDate"
							type="datetime-local"
							bind:value={$form.endDate}
							required
							aria-invalid={resolveFieldError('endDate') ? 'true' : undefined}
						/>
						{#if resolveFieldError('endDate')}
							<p class="text-sm text-red-600">{resolveFieldError('endDate')}</p>
						{/if}
					</div>
				</div>

				<div class="space-y-4 pt-2">
					<p class="text-sm text-slate-500">{$translationStore.createDeal.requiredHint}</p>
					<Button type="submit" size="lg" class="w-full" disabled={$submitting}>
						{$submitting ? labels.submitting : labels.submit}
					</Button>
				</div>
			</div>
		</form>
	</Card>
</section>
