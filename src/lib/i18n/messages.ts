import type { Locale, TranslationMessages } from '$lib/i18n/types';

export const messages: Record<Locale, TranslationMessages> = {
	es: {
		common: {
			appName: 'Ofertando',
			language: 'Idioma',
			spanish: 'Español',
			english: 'Inglés',
			french: 'Francés',
			home: 'Inicio',
			searchPlaceholder: 'Buscar ofertas, tiendas, ciudades...',
			login: 'Entrar',
			register: 'Crear cuenta',
			profile: 'Mi perfil',
			logout: 'Cerrar sesión',
			loading: 'Cargando...'
		},
		auth: {
			loginTitle: 'Inicia sesión',
			loginDescription: 'Usa tu correo registrado para continuar.',
			registerTitle: 'Crear cuenta',
			registerDescription: 'Completa tus datos para empezar.',
			noAccount: '¿No tienes cuenta?',
			registerHere: 'Regístrate aquí',
			alreadyHaveAccount: '¿Ya tienes cuenta?',
			loginHere: 'Inicia sesión',
			email: 'Correo electrónico',
			username: 'Nombre de usuario',
			password: 'Contraseña',
			confirmPassword: 'Confirmar contraseña',
			passwordMismatch: 'Las contraseñas no coinciden.',
			submitLogin: 'Entrar',
			submitRegister: 'Registrarme',
			invalidCredentials:
				'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.',
			duplicateEmail: 'Ese correo ya está registrado. Usa otro o inicia sesión.',
			duplicateUsername: 'Ese nombre de usuario ya existe. Elige uno diferente.',
			invalidEmail: 'Ingresa un correo electrónico válido.',
			usernameRequired: 'Ingresa un nombre de usuario.',
			passwordTooShort: 'La contraseña debe tener al menos 8 caracteres.',
			validationError: 'Revisa los campos del formulario e inténtalo de nuevo.',
			genericLoginError: 'No pudimos iniciar sesión en este momento.',
			genericRegisterError: 'No pudimos crear tu cuenta en este momento.',
			serverError: 'El servidor no está disponible en este momento. Inténtalo más tarde.',
			profileTitle: 'Mi perfil',
			notAuthenticated: 'Debes iniciar sesión para acceder a esta página.',
			sessionExpired: 'Tu sesión ya no es válida.',
			rateLimitedCountdown: 'Demasiados intentos. Vuelve a intentarlo en {seconds}s.'
		},
		profile: {
			memberSince: 'Miembro desde',
			status: 'Estado',
			role: 'Rol',
			offers: 'Ofertas',
			comments: 'Comentarios',
			reputation: 'Reputación',
			votes: 'Votos',
			myOffers: 'Mis ofertas',
			myComments: 'Mis comentarios',
			myVotes: 'Mis votos',
			noOffers: 'Aún no has publicado ofertas.',
			noComments: 'Aún no has comentado ninguna oferta.',
			noVotes: 'Historial de votos no disponible.',
			comingSoon: 'Disponible cuando conectemos los datos de actividad.'
		},
		offer: {
			genericBrowseError: 'No pudimos cargar las ofertas en este momento.',
			genericCreateError: 'No pudimos crear la oferta en este momento.',
			genericUpdateError: 'No pudimos actualizar la oferta en este momento.',
			genericDeleteError: 'No pudimos eliminar la oferta en este momento.',
			serverError: 'El servidor no está disponible en este momento. Inténtalo más tarde.'
		},
		offerStatus: {
			ACTIVE: 'Activa',
			REPORTED: 'Reportada',
			DISABLED: 'Desactivada',
			DELETED: 'Eliminada',
			EXPIRED: 'Expirada'
		},
		deals: {
			voteUp: 'Votar positivo',
			voteDown: 'Votar negativo',
			typeOnline: 'Online',
			typeLocal: 'Local',
			expiresOn: 'Expira',
			filterCity: 'Ciudad',
			filterType: 'Tipo',
			allCities: 'Todas las ciudades',
			allTypes: 'Todos los tipos',
			sortRecent: 'Más recientes',
			sortPopular: 'Más populares',
			periodAll: 'Siempre',
			periodDay: 'Hoy',
			periodWeek: 'Esta semana',
			periodMonth: 'Este mes',
			periodYear: 'Este año'
		},
		errors: {
			'auth.unauthorized': 'Tu sesión ha expirado. Inicia sesión de nuevo.',
			'auth.forbidden': 'No tienes permiso para realizar esta acción.',
			'auth.invalid_credentials':
				'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.',
			'auth.account_disabled': 'Tu cuenta está deshabilitada. Contacta con el soporte.',
			'user.email_taken': 'Ese correo ya está registrado. Usa otro o inicia sesión.',
			'user.username_taken': 'Ese nombre de usuario ya existe. Elige uno diferente.',
			'offer.not_found': 'No encontramos esa oferta. Puede haber sido eliminada.',
			'offer.forbidden': 'No tienes permiso para modificar esta oferta.',
			'offer.invalid_dates':
				'Las fechas no son válidas: la fecha de fin debe ser posterior al inicio y estar en el futuro.',
			'offer.invalid_status_transition': 'Esta oferta ya no se puede modificar.',
			'pagination.invalid_cursor': 'La paginación ha expirado. Reiniciamos desde el principio.',
			'validation.failed': 'Revisa los campos del formulario e inténtalo de nuevo.',
			'db.unique_violation': 'Ya existe un registro con esos datos.',
			'db.not_found': 'No encontramos lo que buscas.',
			'error.bad_request': 'La petición no es válida.',
			'error.not_found': 'Recurso no encontrado.',
			'error.too_many_requests':
				'Demasiados intentos. Espera un momento antes de volver a intentarlo.',
			'error.internal': 'Algo salió mal en el servidor. Inténtalo más tarde.',
			fallback: 'Ha ocurrido un error inesperado. Inténtalo de nuevo.'
		},
		validation: {
			fields: {
				email: {
					isEmail: 'Ingresa un correo electrónico válido.',
					isString: 'El correo debe ser una cadena de texto.'
				},
				username: {
					isString: 'El nombre de usuario debe ser una cadena de texto.',
					isNotEmpty: 'Ingresa un nombre de usuario.'
				},
				password: {
					isString: 'La contraseña debe ser una cadena de texto.',
					minLength: 'La contraseña debe tener al menos 8 caracteres.'
				},
				title: {
					isString: 'El título debe ser una cadena de texto.',
					isNotEmpty: 'Ingresa un título.',
					maxLength: 'El título es demasiado largo (máximo 200 caracteres).'
				},
				description: {
					isString: 'La descripción debe ser una cadena de texto.',
					isNotEmpty: 'Ingresa una descripción.',
					maxLength: 'La descripción es demasiado larga (máximo 5000 caracteres).'
				},
				offerType: {
					isString: 'El tipo de oferta debe ser una cadena de texto.',
					isNotEmpty: 'Selecciona un tipo de oferta.',
					maxLength: 'El tipo de oferta es demasiado largo (máximo 50 caracteres).'
				},
				externalUrl: {
					isString: 'El enlace debe ser una cadena de texto.',
					isUrl: 'Ingresa una URL válida.'
				},
				storeName: {
					isString: 'El nombre de la tienda debe ser una cadena de texto.',
					isNotEmpty: 'Ingresa el nombre de la tienda.',
					maxLength: 'El nombre de la tienda es demasiado largo (máximo 100 caracteres).'
				},
				city: {
					isString: 'La ciudad debe ser una cadena de texto.',
					isNotEmpty: 'Ingresa una ciudad.',
					maxLength: 'El nombre de la ciudad es demasiado largo (máximo 100 caracteres).'
				},
				startDate: {
					isDateString: 'Fecha de inicio inválida (formato ISO 8601 esperado).'
				},
				endDate: {
					isDateString: 'Fecha de fin inválida (formato ISO 8601 esperado).'
				}
			},
			system: {
				whitelistValidation: 'Campo inesperado en la solicitud.'
			},
			fallback: 'Campo no válido.'
		},
		errorPage: {
			notFoundTitle: 'Página no encontrada',
			notFoundDescription: 'La página que buscas no existe o fue movida.',
			genericTitle: 'Algo salió mal',
			genericDescription: 'Inténtalo de nuevo en unos momentos.',
			backToHome: 'Volver al inicio'
		}
	},
	en: {
		common: {
			appName: 'Ofertando',
			language: 'Language',
			spanish: 'Spanish',
			english: 'English',
			french: 'French',
			home: 'Home',
			searchPlaceholder: 'Search deals, stores, cities...',
			login: 'Log in',
			register: 'Create account',
			profile: 'My profile',
			logout: 'Log out',
			loading: 'Loading...'
		},
		auth: {
			loginTitle: 'Log in',
			loginDescription: 'Use your registered email to continue.',
			registerTitle: 'Create account',
			registerDescription: 'Complete your details to get started.',
			noAccount: "Don't have an account?",
			registerHere: 'Register here',
			alreadyHaveAccount: 'Already have an account?',
			loginHere: 'Log in',
			email: 'Email',
			username: 'Username',
			password: 'Password',
			confirmPassword: 'Confirm password',
			passwordMismatch: 'Passwords do not match.',
			submitLogin: 'Log in',
			submitRegister: 'Sign up',
			invalidCredentials:
				'Incorrect email or password. Please check your credentials and try again.',
			duplicateEmail: 'That email is already registered. Use another one or sign in.',
			duplicateUsername: 'That username already exists. Choose a different one.',
			invalidEmail: 'Enter a valid email address.',
			usernameRequired: 'Enter a username.',
			passwordTooShort: 'Password must be at least 8 characters long.',
			validationError: 'Check the form fields and try again.',
			genericLoginError: 'We could not log you in right now.',
			genericRegisterError: 'We could not create your account right now.',
			serverError: 'The server is unavailable right now. Please try again later.',
			profileTitle: 'My profile',
			notAuthenticated: 'You must log in to access this page.',
			sessionExpired: 'Your session is no longer valid.',
			rateLimitedCountdown: 'Too many attempts. Try again in {seconds}s.'
		},
		profile: {
			memberSince: 'Member since',
			status: 'Status',
			role: 'Role',
			offers: 'Offers',
			comments: 'Comments',
			reputation: 'Reputation',
			votes: 'Votes',
			myOffers: 'My offers',
			myComments: 'My comments',
			myVotes: 'My votes',
			noOffers: 'You have not published any offers yet.',
			noComments: 'You have not commented on any offer yet.',
			noVotes: 'Vote history is not available yet.',
			comingSoon: 'Available when activity data is connected.'
		},
		offer: {
			genericBrowseError: 'We could not load the offers right now.',
			genericCreateError: 'We could not create the offer right now.',
			genericUpdateError: 'We could not update the offer right now.',
			genericDeleteError: 'We could not delete the offer right now.',
			serverError: 'The server is unavailable right now. Please try again later.'
		},
		offerStatus: {
			ACTIVE: 'Active',
			REPORTED: 'Reported',
			DISABLED: 'Disabled',
			DELETED: 'Deleted',
			EXPIRED: 'Expired'
		},
		deals: {
			voteUp: 'Vote up',
			voteDown: 'Vote down',
			typeOnline: 'Online',
			typeLocal: 'Local',
			expiresOn: 'Expires',
			filterCity: 'City',
			filterType: 'Type',
			allCities: 'All cities',
			allTypes: 'All types',
			sortRecent: 'Most recent',
			sortPopular: 'Most popular',
			periodAll: 'All time',
			periodDay: 'Today',
			periodWeek: 'This week',
			periodMonth: 'This month',
			periodYear: 'This year'
		},
		errors: {
			'auth.unauthorized': 'Your session has expired. Please log in again.',
			'auth.forbidden': 'You do not have permission to perform this action.',
			'auth.invalid_credentials':
				'Incorrect email or password. Please check your credentials and try again.',
			'auth.account_disabled': 'Your account is disabled. Please contact support.',
			'user.email_taken': 'That email is already registered. Use another one or sign in.',
			'user.username_taken': 'That username already exists. Choose a different one.',
			'offer.not_found': 'We could not find that offer. It may have been removed.',
			'offer.forbidden': 'You do not have permission to modify this offer.',
			'offer.invalid_dates':
				'Invalid dates: the end date must be after the start date and in the future.',
			'offer.invalid_status_transition': 'This offer can no longer be modified.',
			'pagination.invalid_cursor': 'Pagination expired. We have reset to the first page.',
			'validation.failed': 'Check the form fields and try again.',
			'db.unique_violation': 'A record with these details already exists.',
			'db.not_found': 'We could not find what you are looking for.',
			'error.bad_request': 'The request is not valid.',
			'error.not_found': 'Resource not found.',
			'error.too_many_requests': 'Too many attempts. Please wait a moment before trying again.',
			'error.internal': 'Something went wrong on the server. Please try again later.',
			fallback: 'An unexpected error occurred. Please try again.'
		},
		validation: {
			fields: {
				email: {
					isEmail: 'Enter a valid email address.',
					isString: 'The email must be a string.'
				},
				username: {
					isString: 'The username must be a string.',
					isNotEmpty: 'Enter a username.'
				},
				password: {
					isString: 'The password must be a string.',
					minLength: 'Password must be at least 8 characters long.'
				},
				title: {
					isString: 'The title must be a string.',
					isNotEmpty: 'Enter a title.',
					maxLength: 'The title is too long (max 200 characters).'
				},
				description: {
					isString: 'The description must be a string.',
					isNotEmpty: 'Enter a description.',
					maxLength: 'The description is too long (max 5000 characters).'
				},
				offerType: {
					isString: 'The offer type must be a string.',
					isNotEmpty: 'Select an offer type.',
					maxLength: 'The offer type is too long (max 50 characters).'
				},
				externalUrl: {
					isString: 'The link must be a string.',
					isUrl: 'Enter a valid URL.'
				},
				storeName: {
					isString: 'The store name must be a string.',
					isNotEmpty: 'Enter the store name.',
					maxLength: 'The store name is too long (max 100 characters).'
				},
				city: {
					isString: 'The city must be a string.',
					isNotEmpty: 'Enter a city.',
					maxLength: 'The city name is too long (max 100 characters).'
				},
				startDate: {
					isDateString: 'Invalid start date (ISO 8601 format expected).'
				},
				endDate: {
					isDateString: 'Invalid end date (ISO 8601 format expected).'
				}
			},
			system: {
				whitelistValidation: 'Unexpected field in the request.'
			},
			fallback: 'Invalid field.'
		},
		errorPage: {
			notFoundTitle: 'Page not found',
			notFoundDescription: 'The page you are looking for does not exist or has been moved.',
			genericTitle: 'Something went wrong',
			genericDescription: 'Please try again in a few moments.',
			backToHome: 'Back to home'
		}
	},
	fr: {
		common: {
			appName: 'Ofertando',
			language: 'Langue',
			spanish: 'Espagnol',
			english: 'Anglais',
			french: 'Français',
			home: 'Accueil',
			searchPlaceholder: 'Rechercher des offres, magasins, villes...',
			login: 'Se connecter',
			register: 'Créer un compte',
			profile: 'Mon profil',
			logout: 'Se déconnecter',
			loading: 'Chargement...'
		},
		auth: {
			loginTitle: 'Se connecter',
			loginDescription: 'Utilisez votre e-mail enregistré pour continuer.',
			registerTitle: 'Créer un compte',
			registerDescription: 'Complétez vos informations pour commencer.',
			noAccount: "Vous n'avez pas de compte ?",
			registerHere: 'Inscrivez-vous ici',
			alreadyHaveAccount: 'Vous avez déjà un compte ?',
			loginHere: 'Connectez-vous',
			email: 'E-mail',
			username: "Nom d'utilisateur",
			password: 'Mot de passe',
			confirmPassword: 'Confirmer le mot de passe',
			passwordMismatch: 'Les mots de passe ne correspondent pas.',
			submitLogin: 'Se connecter',
			submitRegister: "S'inscrire",
			invalidCredentials:
				'E-mail ou mot de passe incorrect. Vérifiez vos informations et réessayez.',
			duplicateEmail: 'Cet e-mail est déjà enregistré. Utilisez-en un autre ou connectez-vous.',
			duplicateUsername: "Ce nom d'utilisateur existe déjà. Choisissez-en un autre.",
			invalidEmail: 'Saisissez une adresse e-mail valide.',
			usernameRequired: "Saisissez un nom d'utilisateur.",
			passwordTooShort: 'Le mot de passe doit contenir au moins 8 caractères.',
			validationError: 'Vérifiez les champs du formulaire et réessayez.',
			genericLoginError: "Nous n'avons pas pu vous connecter pour le moment.",
			genericRegisterError: "Nous n'avons pas pu créer votre compte pour le moment.",
			serverError: "Le serveur n'est pas disponible pour le moment. Réessayez plus tard.",
			profileTitle: 'Mon profil',
			notAuthenticated: 'Vous devez vous connecter pour accéder à cette page.',
			sessionExpired: "Votre session n'est plus valide.",
			rateLimitedCountdown: 'Trop de tentatives. Réessayez dans {seconds}s.'
		},
		profile: {
			memberSince: 'Membre depuis',
			status: 'Statut',
			role: 'Rôle',
			offers: 'Offres',
			comments: 'Commentaires',
			reputation: 'Réputation',
			votes: 'Votes',
			myOffers: 'Mes offres',
			myComments: 'Mes commentaires',
			myVotes: 'Mes votes',
			noOffers: "Vous n'avez pas encore publié d'offres.",
			noComments: "Vous n'avez encore commenté aucune offre.",
			noVotes: "L'historique des votes n'est pas encore disponible.",
			comingSoon: "Disponible lorsque les données d'activité seront connectées."
		},
		offer: {
			genericBrowseError: "Nous n'avons pas pu charger les offres pour le moment.",
			genericCreateError: "Nous n'avons pas pu créer l'offre pour le moment.",
			genericUpdateError: "Nous n'avons pas pu mettre à jour l'offre pour le moment.",
			genericDeleteError: "Nous n'avons pas pu supprimer l'offre pour le moment.",
			serverError: "Le serveur n'est pas disponible pour le moment. Réessayez plus tard."
		},
		offerStatus: {
			ACTIVE: 'Active',
			REPORTED: 'Signalée',
			DISABLED: 'Désactivée',
			DELETED: 'Supprimée',
			EXPIRED: 'Expirée'
		},
		deals: {
			voteUp: 'Voter positif',
			voteDown: 'Voter négatif',
			typeOnline: 'En ligne',
			typeLocal: 'Local',
			expiresOn: 'Expire',
			filterCity: 'Ville',
			filterType: 'Type',
			allCities: 'Toutes les villes',
			allTypes: 'Tous les types',
			sortRecent: 'Plus récentes',
			sortPopular: 'Plus populaires',
			periodAll: 'Toujours',
			periodDay: "Aujourd'hui",
			periodWeek: 'Cette semaine',
			periodMonth: 'Ce mois-ci',
			periodYear: 'Cette année'
		},
		errors: {
			'auth.unauthorized': 'Votre session a expiré. Reconnectez-vous.',
			'auth.forbidden': "Vous n'avez pas la permission d'effectuer cette action.",
			'auth.invalid_credentials':
				'E-mail ou mot de passe incorrect. Vérifiez vos informations et réessayez.',
			'auth.account_disabled': 'Votre compte est désactivé. Contactez le support.',
			'user.email_taken': 'Cet e-mail est déjà enregistré. Utilisez-en un autre ou connectez-vous.',
			'user.username_taken': "Ce nom d'utilisateur existe déjà. Choisissez-en un autre.",
			'offer.not_found': "Nous n'avons pas trouvé cette offre. Elle a peut-être été supprimée.",
			'offer.forbidden': "Vous n'avez pas la permission de modifier cette offre.",
			'offer.invalid_dates':
				'Dates invalides : la date de fin doit être après la date de début et dans le futur.',
			'offer.invalid_status_transition': 'Cette offre ne peut plus être modifiée.',
			'pagination.invalid_cursor':
				'La pagination a expiré. Nous repartons depuis la première page.',
			'validation.failed': 'Vérifiez les champs du formulaire et réessayez.',
			'db.unique_violation': 'Un enregistrement avec ces données existe déjà.',
			'db.not_found': "Nous n'avons pas trouvé ce que vous cherchez.",
			'error.bad_request': "La requête n'est pas valide.",
			'error.not_found': 'Ressource introuvable.',
			'error.too_many_requests': 'Trop de tentatives. Patientez un instant avant de réessayer.',
			'error.internal': 'Une erreur est survenue sur le serveur. Réessayez plus tard.',
			fallback: 'Une erreur inattendue est survenue. Réessayez.'
		},
		validation: {
			fields: {
				email: {
					isEmail: 'Saisissez une adresse e-mail valide.',
					isString: "L'e-mail doit être une chaîne de caractères."
				},
				username: {
					isString: "Le nom d'utilisateur doit être une chaîne de caractères.",
					isNotEmpty: "Saisissez un nom d'utilisateur."
				},
				password: {
					isString: 'Le mot de passe doit être une chaîne de caractères.',
					minLength: 'Le mot de passe doit faire au moins 8 caractères.'
				},
				title: {
					isString: 'Le titre doit être une chaîne de caractères.',
					isNotEmpty: 'Saisissez un titre.',
					maxLength: 'Le titre est trop long (200 caractères maximum).'
				},
				description: {
					isString: 'La description doit être une chaîne de caractères.',
					isNotEmpty: 'Saisissez une description.',
					maxLength: 'La description est trop longue (5000 caractères maximum).'
				},
				offerType: {
					isString: "Le type d'offre doit être une chaîne de caractères.",
					isNotEmpty: "Sélectionnez un type d'offre.",
					maxLength: "Le type d'offre est trop long (50 caractères maximum)."
				},
				externalUrl: {
					isString: 'Le lien doit être une chaîne de caractères.',
					isUrl: 'Saisissez une URL valide.'
				},
				storeName: {
					isString: 'Le nom du magasin doit être une chaîne de caractères.',
					isNotEmpty: 'Saisissez le nom du magasin.',
					maxLength: 'Le nom du magasin est trop long (100 caractères maximum).'
				},
				city: {
					isString: 'La ville doit être une chaîne de caractères.',
					isNotEmpty: 'Saisissez une ville.',
					maxLength: 'Le nom de la ville est trop long (100 caractères maximum).'
				},
				startDate: {
					isDateString: 'Date de début invalide (format ISO 8601 attendu).'
				},
				endDate: {
					isDateString: 'Date de fin invalide (format ISO 8601 attendu).'
				}
			},
			system: {
				whitelistValidation: 'Champ inattendu dans la requête.'
			},
			fallback: 'Champ non valide.'
		},
		errorPage: {
			notFoundTitle: 'Page introuvable',
			notFoundDescription: "La page que vous recherchez n'existe pas ou a été déplacée.",
			genericTitle: 'Une erreur est survenue',
			genericDescription: 'Veuillez réessayer dans quelques instants.',
			backToHome: "Retour à l'accueil"
		}
	}
};
