import { describe, expect, it } from 'vitest';
import { ApiError } from '$lib/api/client';
import { messages } from '$lib/i18n/messages';
import { formatRateLimitedMessage, resolveAuthError } from '$lib/auth/authErrors';

const t = messages.es;

describe('resolveAuthError', () => {
	it('maps invalid credentials to a banner message', () => {
		const error = new ApiError('auth.invalid_credentials', 401);

		expect(resolveAuthError(error, t, 'login')).toEqual({
			bannerMessage: t.errors['auth.invalid_credentials'],
			fieldErrors: {}
		});
	});

	it('maps user.email_taken to a field error on email', () => {
		const error = new ApiError('user.email_taken', 409);

		expect(resolveAuthError(error, t, 'register')).toEqual({
			bannerMessage: null,
			fieldErrors: { email: t.errors['user.email_taken'] }
		});
	});

	it('maps user.username_taken to a field error on username', () => {
		const error = new ApiError('user.username_taken', 409);

		expect(resolveAuthError(error, t, 'register')).toEqual({
			bannerMessage: null,
			fieldErrors: { username: t.errors['user.username_taken'] }
		});
	});

	it('maps user.current_password_required to a field error on currentPassword', () => {
		const error = new ApiError('user.current_password_required', 400);

		expect(resolveAuthError(error, t, 'editProfile')).toEqual({
			bannerMessage: null,
			fieldErrors: { currentPassword: t.errors['user.current_password_required'] }
		});
	});

	it('maps user.invalid_current_password to a field error on currentPassword', () => {
		const error = new ApiError('user.invalid_current_password', 400);

		expect(resolveAuthError(error, t, 'editProfile')).toEqual({
			bannerMessage: null,
			fieldErrors: { currentPassword: t.errors['user.invalid_current_password'] }
		});
	});

	it('falls back to the profile-update generic for editProfile errors', () => {
		expect(resolveAuthError(new Error('network'), t, 'editProfile')).toEqual({
			bannerMessage: t.auth.genericUpdateError,
			fieldErrors: {}
		});
	});

	it('extracts validation.failed details into per-field errors', () => {
		const error = new ApiError('validation.failed', 400, {
			fields: [
				{ field: 'email', constraints: ['isEmail'] },
				{ field: 'password', constraints: ['minLength'] }
			]
		});

		expect(resolveAuthError(error, t, 'register')).toEqual({
			bannerMessage: null,
			fieldErrors: {
				email: t.validation.fields.email.isEmail,
				password: t.validation.fields.password.minLength
			}
		});
	});

	it('falls back to a banner when validation.failed has no usable details', () => {
		const error = new ApiError('validation.failed', 400);

		expect(resolveAuthError(error, t, 'register')).toEqual({
			bannerMessage: t.errors['validation.failed'],
			fieldErrors: {}
		});
	});

	it('translates other known keys to their banner messages', () => {
		const error = new ApiError('error.too_many_requests', 429);

		expect(resolveAuthError(error, t, 'login')).toEqual({
			bannerMessage: t.errors['error.too_many_requests'],
			fieldErrors: {}
		});
	});

	it('maps 5xx with unknown key to the server error message', () => {
		const error = new ApiError(null, 502);

		expect(resolveAuthError(error, t, 'login')).toEqual({
			bannerMessage: t.auth.serverError,
			fieldErrors: {}
		});
	});

	it('falls back to the login generic message for non-ApiError', () => {
		expect(resolveAuthError(new Error('network'), t, 'login')).toEqual({
			bannerMessage: t.auth.genericLoginError,
			fieldErrors: {}
		});
	});

	it('falls back to the register generic message for non-ApiError', () => {
		expect(resolveAuthError(new Error('network'), t, 'register')).toEqual({
			bannerMessage: t.auth.genericRegisterError,
			fieldErrors: {}
		});
	});

	it('falls back to the contextual generic for unknown ApiError keys', () => {
		const error = new ApiError('something.brand_new', 418);

		expect(resolveAuthError(error, t, 'register')).toEqual({
			bannerMessage: t.auth.genericRegisterError,
			fieldErrors: {}
		});
	});
});

describe('formatRateLimitedMessage', () => {
	it('interpolates the seconds count into the localized template', () => {
		expect(formatRateLimitedMessage(42, t)).toBe(
			'Demasiados intentos. Vuelve a intentarlo en 42s.'
		);
	});

	it('clamps negative seconds to zero', () => {
		expect(formatRateLimitedMessage(-3, t)).toBe('Demasiados intentos. Vuelve a intentarlo en 0s.');
	});
});
