import { ApiError } from '$lib/api/client';
import { ErrorKey, isKnownErrorKey } from '$lib/errors/errorKeys';
import { getFieldErrorMap } from '$lib/errors/getErrorMessage';
import type { TranslationMessages } from '$lib/i18n/types';

export type OfferContext = 'browse' | 'create' | 'update' | 'delete' | 'vote' | 'report';

export interface ResolvedOfferError {
	bannerMessage: string | null;
	fieldErrors: Record<string, string>;
}

export function resolveOfferError(
	error: unknown,
	t: TranslationMessages,
	context: OfferContext
): ResolvedOfferError {
	if (!(error instanceof ApiError)) {
		return { bannerMessage: genericFallback(t, context), fieldErrors: {} };
	}

	if (error.key === ErrorKey.ValidationFailed) {
		const fieldErrors = getFieldErrorMap(error.details, t);
		if (Object.keys(fieldErrors).length > 0) {
			return { bannerMessage: null, fieldErrors };
		}
		return { bannerMessage: t.errors['validation.failed'], fieldErrors: {} };
	}

	if (isKnownErrorKey(error.key)) {
		return { bannerMessage: t.errors[error.key], fieldErrors: {} };
	}

	if (error.status >= 500) {
		return { bannerMessage: t.offer.serverError, fieldErrors: {} };
	}

	return { bannerMessage: genericFallback(t, context), fieldErrors: {} };
}

function genericFallback(t: TranslationMessages, context: OfferContext): string {
	switch (context) {
		case 'browse':
			return t.offer.genericBrowseError;
		case 'create':
			return t.offer.genericCreateError;
		case 'update':
			return t.offer.genericUpdateError;
		case 'delete':
			return t.offer.genericDeleteError;
		case 'vote':
			return t.offer.genericVoteError;
		case 'report':
			return t.offer.genericReportError;
	}
}
