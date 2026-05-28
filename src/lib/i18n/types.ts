export const SUPPORTED_LOCALES = ['es', 'en', 'fr'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export interface ErrorMessages {
	'auth.unauthorized': string;
	'auth.forbidden': string;
	'auth.invalid_credentials': string;
	'auth.account_disabled': string;
	'user.email_taken': string;
	'user.username_taken': string;
	'offer.not_found': string;
	'offer.forbidden': string;
	'offer.invalid_dates': string;
	'offer.invalid_status_transition': string;
	'vote.offer_not_voteable': string;
	'report.offer_not_reportable': string;
	'pagination.invalid_cursor': string;
	'validation.failed': string;
	'db.unique_violation': string;
	'db.not_found': string;
	'error.bad_request': string;
	'error.not_found': string;
	'error.too_many_requests': string;
	'error.internal': string;
	fallback: string;
}

export interface ValidationMessages {
	fields: Record<string, Record<string, string>>;
	system: Record<string, string>;
	fallback: string;
}

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
		confirmPassword: string;
		passwordMismatch: string;
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
		rateLimitedCountdown: string;
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
		noOffersDescription: string;
		noComments: string;
		noVotes: string;
		comingSoon: string;
		publishOffer: string;
		offerActions: string;
		retry: string;
	};
	offer: {
		genericBrowseError: string;
		genericCreateError: string;
		genericUpdateError: string;
		genericDeleteError: string;
		genericVoteError: string;
		genericReportError: string;
		serverError: string;
	};
	offerStatus: {
		ACTIVE: string;
		REPORTED: string;
		DISABLED: string;
		DELETED: string;
		EXPIRED: string;
	};
	deals: {
		voteUp: string;
		voteDown: string;
		typeOnline: string;
		typeLocal: string;
		expiresOn: string;
		filterCity: string;
		filterType: string;
		allCities: string;
		allTypes: string;
		sortRecent: string;
		sortPopular: string;
		periodAll: string;
		periodDay: string;
		periodWeek: string;
		periodMonth: string;
		periodYear: string;
		listingTitle: string;
		loadMore: string;
		empty: string;
	};
	createDeal: {
		pageTitle: string;
		heading: string;
		intro: string;
		titleLabel: string;
		titlePlaceholder: string;
		descriptionLabel: string;
		descriptionPlaceholder: string;
		offerTypeLabel: string;
		offerTypeOnline: string;
		offerTypeLocal: string;
		externalUrlLabel: string;
		externalUrlPlaceholder: string;
		externalUrlHint: string;
		storeNameLabel: string;
		storeNamePlaceholder: string;
		cityLabel: string;
		cityPlaceholder: string;
		startDateLabel: string;
		endDateLabel: string;
		requiredHint: string;
		submit: string;
		submitting: string;
		genericError: string;
	};
	editDeal: {
		pageTitle: string;
		heading: string;
		intro: string;
		submit: string;
		submitting: string;
		genericError: string;
	};
	deleteDeal: {
		openButton: string;
		title: string;
		description: string;
		cancel: string;
		confirm: string;
		deleting: string;
		genericError: string;
	};
	home: {
		heroTitle: string;
		heroSubtitle: string;
		exploreCta: string;
		publishCta: string;
		hotDealsTitle: string;
		recentDealsTitle: string;
		popularStoresTitle: string;
		viewAll: string;
	};
	footer: {
		rights: string;
		terms: string;
		privacy: string;
		contact: string;
	};
	report: {
		modalTitle: string;
		modalDescription: string;
		reasonLabel: string;
		reasonPlaceholder: string;
		commentLabel: string;
		commentPlaceholder: string;
		commentHint: string;
		submit: string;
		submitting: string;
		cancel: string;
		alreadyReported: string;
		genericError: string;
		reasons: {
			EXPIRED: string;
			UNAVAILABLE: string;
			INCORRECT_INFO: string;
			SCAM: string;
			OTHER: string;
		};
	};
	deal: {
		goToStore: string;
		edit: string;
		report: string;
		share: string;
		publishedBy: string;
		relatedTitle: string;
		relatedEmpty: string;
		commentsTitle: string;
		commentPlaceholder: string;
		commentSubmit: string;
		commentDisabledHint: string;
		expiredBanner: string;
		disabledBanner: string;
		reportedBanner: string;
		mockComment1: string;
		mockComment2: string;
		mockComment3: string;
		mockCommentAge: string;
	};
	errors: ErrorMessages;
	validation: ValidationMessages;
	errorPage: {
		notFoundTitle: string;
		notFoundDescription: string;
		genericTitle: string;
		genericDescription: string;
		backToHome: string;
	};
}
