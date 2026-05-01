import { describe, expect, it } from 'vitest';
import { ApiError } from '$lib/api/client';
import { messages } from '$lib/i18n/messages';
import { getRegisterErrorMessage } from '$lib/auth/registerErrors';

const authMessages = messages.es.auth;

describe('getRegisterErrorMessage', () => {
	it('maps duplicate email errors', () => {
		const error = new ApiError('Email is already registered', 400);

		expect(getRegisterErrorMessage(error, authMessages)).toBe(authMessages.duplicateEmail);
	});

	it('maps duplicate username errors', () => {
		const error = new ApiError('Username is already registered', 400);

		expect(getRegisterErrorMessage(error, authMessages)).toBe(authMessages.duplicateUsername);
	});

	it('maps invalid email validation errors', () => {
		const error = new ApiError('email must be an email', 400);

		expect(getRegisterErrorMessage(error, authMessages)).toBe(authMessages.invalidEmail);
	});

	it('maps empty username validation errors', () => {
		const error = new ApiError('username should not be empty', 400);

		expect(getRegisterErrorMessage(error, authMessages)).toBe(authMessages.usernameRequired);
	});

	it('maps short password validation errors', () => {
		const error = new ApiError('password must be longer than or equal to 8 characters', 400);

		expect(getRegisterErrorMessage(error, authMessages)).toBe(authMessages.passwordTooShort);
	});

	it('maps unknown 400 errors to a generic validation message', () => {
		const error = new ApiError('Invalid request body', 400);

		expect(getRegisterErrorMessage(error, authMessages)).toBe(authMessages.validationError);
	});

	it('maps server errors to a server unavailable message', () => {
		const error = new ApiError('Internal server error', 500);

		expect(getRegisterErrorMessage(error, authMessages)).toBe(authMessages.serverError);
	});

	it('maps unknown non-validation errors to the generic register message', () => {
		const error = new ApiError('Unexpected conflict', 409);

		expect(getRegisterErrorMessage(error, authMessages)).toBe(authMessages.genericRegisterError);
	});
});
