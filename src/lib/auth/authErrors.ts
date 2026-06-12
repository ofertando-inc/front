import { ApiError } from '$lib/api/client';
import { ErrorKey, isKnownErrorKey } from '$lib/errors/errorKeys';
import { getFieldErrorMap } from '$lib/errors/getErrorMessage';
import type { TranslationMessages } from '$lib/i18n/types';

export type AuthContext = 'login' | 'register' | 'editProfile';

export interface ResolvedAuthError {
	bannerMessage: string | null;
	fieldErrors: Record<string, string>;
}

export function resolveAuthError(
	error: unknown,
	t: TranslationMessages,
	context: AuthContext
): ResolvedAuthError {
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

	if (error.key === ErrorKey.UserEmailTaken) {
		return {
			bannerMessage: null,
			fieldErrors: { email: t.errors['user.email_taken'] }
		};
	}

	if (error.key === ErrorKey.UserUsernameTaken) {
		return {
			bannerMessage: null,
			fieldErrors: { username: t.errors['user.username_taken'] }
		};
	}

	if (error.key === ErrorKey.UserCurrentPasswordRequired) {
		return {
			bannerMessage: null,
			fieldErrors: { currentPassword: t.errors['user.current_password_required'] }
		};
	}

	if (error.key === ErrorKey.UserInvalidCurrentPassword) {
		return {
			bannerMessage: null,
			fieldErrors: { currentPassword: t.errors['user.invalid_current_password'] }
		};
	}

	if (isKnownErrorKey(error.key)) {
		return { bannerMessage: t.errors[error.key], fieldErrors: {} };
	}

	if (error.status >= 500) {
		return { bannerMessage: t.auth.serverError, fieldErrors: {} };
	}

	return { bannerMessage: genericFallback(t, context), fieldErrors: {} };
}

function genericFallback(t: TranslationMessages, context: AuthContext) {
	if (context === 'login') return t.auth.genericLoginError;
	if (context === 'editProfile') return t.auth.genericUpdateError;
	return t.auth.genericRegisterError;
}

export const DEFAULT_RATE_LIMIT_COOLDOWN_SECONDS = 60;

export function formatRateLimitedMessage(seconds: number, t: TranslationMessages): string {
	return t.auth.rateLimitedCountdown.replace('{seconds}', String(Math.max(0, seconds)));
}
