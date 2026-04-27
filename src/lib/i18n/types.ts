export const SUPPORTED_LOCALES = ['es', 'en', 'fr'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export interface TranslationMessages {
	common: {
		appName: string;
		language: string;
		spanish: string;
		english: string;
		french: string;
		login: string;
		register: string;
		profile: string;
		logout: string;
		loading: string;
	};
	auth: {
		loginTitle: string;
		loginDescription: string;
		registerTitle: string;
		registerDescription: string;
		email: string;
		username: string;
		password: string;
		submitLogin: string;
		submitRegister: string;
		invalidCredentials: string;
		duplicateEmail: string;
		duplicateUsername: string;
		genericLoginError: string;
		genericRegisterError: string;
		profileTitle: string;
		profileDescription: string;
		notAuthenticated: string;
		sessionExpired: string;
	};
}
