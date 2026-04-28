import type { Locale, TranslationMessages } from '$lib/i18n/types';

export const messages: Record<Locale, TranslationMessages> = {
	es: {
		common: {
			appName: 'Ofertando',
			language: 'Idioma',
			spanish: 'Espanol',
			english: 'Ingles',
			french: 'Frances',
			login: 'Entrar',
			register: 'Crear cuenta',
			profile: 'Mi perfil',
			logout: 'Cerrar sesion',
			loading: 'Cargando...'
		},
		auth: {
			loginTitle: 'Inicia sesion',
			loginDescription: 'Usa tu correo registrado para continuar.',
			registerTitle: 'Crear cuenta',
			registerDescription: 'Completa tus datos para empezar.',
			email: 'Correo electronico',
			username: 'Nombre de usuario',
			password: 'Contrasena',
			submitLogin: 'Entrar',
			submitRegister: 'Registrarme',
			invalidCredentials: 'Correo o contrasena incorrectos. Verifica tus datos e intentalo de nuevo.',
			duplicateEmail: 'Ese correo ya esta registrado. Usa otro o inicia sesion.',
			duplicateUsername: 'Ese nombre de usuario ya existe. Elige uno diferente.',
			invalidEmail: 'Ingresa un correo electronico valido.',
			usernameRequired: 'Ingresa un nombre de usuario.',
			passwordTooShort: 'La contrasena debe tener al menos 8 caracteres.',
			validationError: 'Revisa los campos del formulario e intentalo de nuevo.',
			genericLoginError: 'No pudimos iniciar sesion en este momento.',
			genericRegisterError: 'No pudimos crear tu cuenta en este momento.',
			serverError: 'El servidor no esta disponible en este momento. Intentalo mas tarde.',
			profileTitle: 'Mi perfil',
			notAuthenticated: 'Debes iniciar sesion para acceder a esta pagina.',
			sessionExpired: 'Tu sesion ya no es valida.'
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
			invalidCredentials: 'Incorrect email or password. Please check your credentials and try again.',
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
			french: 'Francais',
			login: 'Se connecter',
			register: 'Creer un compte',
			profile: 'Mon profil',
			logout: 'Se deconnecter',
			loading: 'Chargement...'
		},
		auth: {
			loginTitle: 'Se connecter',
			loginDescription: 'Utilisez votre e-mail enregistre pour continuer.',
			registerTitle: 'Creer un compte',
			registerDescription: 'Completez vos informations pour commencer.',
			email: 'E-mail',
			username: "Nom d'utilisateur",
			password: 'Mot de passe',
			submitLogin: 'Se connecter',
			submitRegister: "S'inscrire",
			invalidCredentials: 'E-mail ou mot de passe incorrect. Verifiez vos informations et reessayez.',
			duplicateEmail: 'Cet e-mail est deja enregistre. Utilisez-en un autre ou connectez-vous.',
			duplicateUsername: "Ce nom d'utilisateur existe deja. Choisissez-en un autre.",
			invalidEmail: 'Saisissez une adresse e-mail valide.',
			usernameRequired: "Saisissez un nom d'utilisateur.",
			passwordTooShort: 'Le mot de passe doit contenir au moins 8 caracteres.',
			validationError: 'Verifiez les champs du formulaire et reessayez.',
			genericLoginError: "Nous n'avons pas pu vous connecter pour le moment.",
			genericRegisterError: "Nous n'avons pas pu creer votre compte pour le moment.",
			serverError: "Le serveur n'est pas disponible pour le moment. Reessayez plus tard.",
			profileTitle: 'Mon profil',
			notAuthenticated: 'Vous devez vous connecter pour acceder a cette page.',
			sessionExpired: "Votre session n'est plus valide."
		}
	}
};
