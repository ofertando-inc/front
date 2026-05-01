import { ApiError } from '$lib/api/client';
import type { TranslationMessages } from '$lib/i18n';

export function getRegisterErrorMessage(apiError: ApiError, messages: TranslationMessages['auth']) {
	const errorMessages = apiError.message
		.split('\n')
		.map((message) => message.toLowerCase())
		.filter(Boolean);
	const joinedMessage = errorMessages.join(' ');

	if (apiError.status >= 500) {
		return messages.serverError;
	}

	if (joinedMessage.includes('email is already registered')) {
		return messages.duplicateEmail;
	}

	if (joinedMessage.includes('username is already registered')) {
		return messages.duplicateUsername;
	}

	if (errorMessages.some((message) => message.includes('email must be an email'))) {
		return messages.invalidEmail;
	}

	if (errorMessages.some((message) => message.includes('username should not be empty'))) {
		return messages.usernameRequired;
	}

	if (
		errorMessages.some((message) => message.includes('password must be longer than or equal to 8'))
	) {
		return messages.passwordTooShort;
	}

	if (apiError.status === 400) {
		return messages.validationError;
	}

	return messages.genericRegisterError;
}
