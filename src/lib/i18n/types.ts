export const SUPPORTED_LOCALES = ['es', 'en', 'fr'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export interface TranslationMessages {
	common: {
		appName: string;
		language: string;
		spanish: string;
		english: string;
		french: string;
		home: string;
		searchPlaceholder: string;
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
		noAccount: string;
		registerHere: string;
		alreadyHaveAccount: string;
		loginHere: string;
		email: string;
		username: string;
		password: string;
		submitLogin: string;
		submitRegister: string;
		invalidCredentials: string;
		duplicateEmail: string;
		duplicateUsername: string;
		invalidEmail: string;
		usernameRequired: string;
		passwordTooShort: string;
		validationError: string;
		genericLoginError: string;
		genericRegisterError: string;
		serverError: string;
		profileTitle: string;
		notAuthenticated: string;
		sessionExpired: string;
	};
	profile: {
		memberSince: string;
		status: string;
		role: string;
		offers: string;
		comments: string;
		reputation: string;
		votes: string;
		myOffers: string;
		myComments: string;
		myVotes: string;
		noOffers: string;
		noComments: string;
		noVotes: string;
		comingSoon: string;
	};
}
