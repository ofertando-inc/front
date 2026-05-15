export const ErrorKey = {
	AuthUnauthorized: 'auth.unauthorized',
	AuthForbidden: 'auth.forbidden',
	AuthInvalidCredentials: 'auth.invalid_credentials',
	AuthAccountDisabled: 'auth.account_disabled',

	UserEmailTaken: 'user.email_taken',
	UserUsernameTaken: 'user.username_taken',

	ValidationFailed: 'validation.failed',

	DbUniqueViolation: 'db.unique_violation',
	DbNotFound: 'db.not_found',

	ErrorBadRequest: 'error.bad_request',
	ErrorNotFound: 'error.not_found',
	ErrorTooManyRequests: 'error.too_many_requests',
	ErrorInternal: 'error.internal'
} as const;

export type ErrorKey = (typeof ErrorKey)[keyof typeof ErrorKey];

export const KNOWN_ERROR_KEYS: ReadonlySet<string> = new Set(Object.values(ErrorKey));

export function isKnownErrorKey(value: unknown): value is ErrorKey {
	return typeof value === 'string' && KNOWN_ERROR_KEYS.has(value);
}
