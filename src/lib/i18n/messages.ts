import type { Locale, TranslationMessages } from '$lib/i18n/types';

export const messages: Record<Locale, TranslationMessages> = {
	es: {
		common: {
			appName: 'Ofertando',
			language: 'Idioma',
			spanish: 'Español',
			english: 'Inglés',
			french: 'Francés',
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
			email: 'Correo electrónico',
			username: 'Nombre de usuario',
			password: 'Contraseña',
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
			sessionExpired: 'Tu sesión ya no es válida.'
		}
	},
	en: {
		common: {
			appName: 'Ofertando',
			language: 'Language',
			spanish: 'Spanish',
			english: 'English',
			french: 'French',
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
			email: 'Email',
			username: 'Username',
			password: 'Password',
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
			sessionExpired: 'Your session is no longer valid.'
		}
	},
	fr: {
		common: {
			appName: 'Ofertando',
			language: 'Langue',
			spanish: 'Espagnol',
			english: 'Anglais',
			french: 'Français',
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
			email: 'E-mail',
			username: "Nom d'utilisateur",
			password: 'Mot de passe',
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
			sessionExpired: "Votre session n'est plus valide."
		}
	}
};
