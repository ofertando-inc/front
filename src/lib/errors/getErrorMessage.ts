import type { TranslationMessages } from '$lib/i18n/types';
import { isKnownErrorKey } from '$lib/errors/errorKeys';

export interface FieldError {
	field: string;
	constraints: string[];
}

export function getErrorMessage(key: string | null | undefined, t: TranslationMessages): string {
	if (isKnownErrorKey(key)) {
		return t.errors[key];
	}

	return t.errors.fallback;
}

export function getFieldErrorMap(details: unknown, t: TranslationMessages): Record<string, string> {
	const fields = extractFields(details);
	const result: Record<string, string> = {};

	for (const fieldError of fields) {
		if (!fieldError.field || !Array.isArray(fieldError.constraints)) continue;

		const constraint = fieldError.constraints[0];
		if (!constraint) continue;

		result[fieldError.field] = resolveValidationMessage(fieldError.field, constraint, t);
	}

	return result;
}

function extractFields(details: unknown): FieldError[] {
	if (!details || typeof details !== 'object') return [];
	const fields = (details as { fields?: unknown }).fields;
	if (!Array.isArray(fields)) return [];

	return fields.filter(
		(entry): entry is FieldError =>
			!!entry &&
			typeof entry === 'object' &&
			typeof (entry as FieldError).field === 'string' &&
			Array.isArray((entry as FieldError).constraints)
	);
}

function resolveValidationMessage(
	field: string,
	constraint: string,
	t: TranslationMessages
): string {
	const systemMessage = t.validation.system[constraint];
	if (systemMessage) return systemMessage;

	const fieldMessage = t.validation.fields[field]?.[constraint];
	if (fieldMessage) return fieldMessage;

	return t.validation.fallback;
}
