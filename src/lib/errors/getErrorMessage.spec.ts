import { describe, expect, it } from 'vitest';
import { messages } from '$lib/i18n/messages';
import { getErrorMessage, getFieldErrorMap } from '$lib/errors/getErrorMessage';

const t = messages.es;

describe('getErrorMessage', () => {
	it('returns the localized message for a known key', () => {
		expect(getErrorMessage('auth.invalid_credentials', t)).toBe(
			t.errors['auth.invalid_credentials']
		);
	});

	it('returns the fallback for an unknown key', () => {
		expect(getErrorMessage('user.suspended', t)).toBe(t.errors.fallback);
	});

	it('returns the fallback for null or empty key', () => {
		expect(getErrorMessage(null, t)).toBe(t.errors.fallback);
		expect(getErrorMessage(undefined, t)).toBe(t.errors.fallback);
		expect(getErrorMessage('', t)).toBe(t.errors.fallback);
	});
});

describe('getFieldErrorMap', () => {
	it('maps (field, constraint) tuples to localized messages', () => {
		const details = {
			fields: [
				{ field: 'email', constraints: ['isEmail'] },
				{ field: 'password', constraints: ['minLength'] },
				{ field: 'endDate', constraints: ['isAfterStart'] }
			]
		};

		expect(getFieldErrorMap(details, t)).toEqual({
			email: t.validation.fields.email.isEmail,
			password: t.validation.fields.password.minLength,
			endDate: t.validation.fields.endDate.isAfterStart
		});
	});

	it('uses the system message for whitelistValidation', () => {
		const details = {
			fields: [{ field: 'role', constraints: ['whitelistValidation'] }]
		};

		expect(getFieldErrorMap(details, t)).toEqual({
			role: t.validation.system.whitelistValidation
		});
	});

	it('falls back to the generic validation message for unknown couples', () => {
		const details = {
			fields: [{ field: 'email', constraints: ['somethingUnmapped'] }]
		};

		expect(getFieldErrorMap(details, t)).toEqual({
			email: t.validation.fallback
		});
	});

	it('keeps only the first constraint per field', () => {
		const details = {
			fields: [{ field: 'password', constraints: ['isString', 'minLength'] }]
		};

		expect(getFieldErrorMap(details, t)).toEqual({
			password: t.validation.fields.password.isString
		});
	});

	it('returns an empty map when details is missing or malformed', () => {
		expect(getFieldErrorMap(null, t)).toEqual({});
		expect(getFieldErrorMap({}, t)).toEqual({});
		expect(getFieldErrorMap({ fields: 'nope' }, t)).toEqual({});
		expect(getFieldErrorMap({ fields: [{ field: 'email' }] }, t)).toEqual({});
	});
});
