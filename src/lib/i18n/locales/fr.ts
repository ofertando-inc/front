import type { TranslationMessages } from '$lib/i18n/types';

export const fr: TranslationMessages = {
	common: {
		appName: 'Ofertando',
		language: 'Langue',
		spanish: 'Espagnol',
		english: 'Anglais',
		french: 'Français',
		home: 'Accueil',
		explore: 'Explorer',
		search: 'Rechercher',
		searchPlaceholder: 'Rechercher des offres, magasins, villes...',
		login: 'Se connecter',
		register: 'Créer un compte',
		profile: 'Mon profil',
		logout: 'Se déconnecter',
		loading: 'Chargement...',
		admin: 'Administration',
		businessSpace: 'Mon entreprise',
		skipToContent: 'Aller au contenu principal',
		languageLabel: 'Langue',
		userMenu: 'Menu utilisateur',
		darkMode: 'Activer le mode sombre',
		lightMode: 'Activer le mode clair'
	},
	business: {
		title: 'Espace entreprise',
		pendingTitle: 'Affiliation en cours',
		pendingBody:
			'Votre compte entreprise n’a pas encore de commerce affilié. Un administrateur doit approuver l’affiliation ; revenez plus tard.',
		affiliatedTo: 'Commerce affilié',
		affiliatedSince: 'Affilié depuis le',
		statActiveOffers: 'Offres actives (sur {total})',
		statActiveOffersHint:
			'Offres visibles en ce moment, sur tout ce qui est publié avec votre commerce.',
		statViews: 'Vues',
		statViewsHint:
			'Somme des vues du détail de toutes vos offres. Vos propres visites ne comptent pas.',
		statClicks: 'Clics',
		statClicksHint: 'Clics sur « Aller au magasin » vers votre site, sur toutes vos offres.',
		statScore: 'Score',
		statScoreHint: 'Somme des votes de la communauté sur toutes vos offres.',
		statComments: 'Commentaires',
		statCommentsHint: 'Commentaires publiés sur vos offres.',
		statReports: 'Signalements',
		statReportsHint: 'Signalements de la communauté sur vos offres.',
		filterAllOffers: 'Toutes',
		myOffersSubtitle: 'Filtrez par canal ou par adresse.',
		myOffersFilterEmpty: 'Aucune offre ne correspond à ce filtre.',
		publishOfficial: 'Publier une offre officielle',
		requestLocation: 'Demander une adresse',
		requestLocationTitle: 'Demander une nouvelle adresse',
		requestLocationHint:
			'L’adresse sera ajoutée à votre commerce et restera en attente de validation par un administrateur.',
		requestLocationSubmit: 'Envoyer la demande',
		requestLocationSubmitting: 'Envoi...',
		requestLocationSuccess: 'Adresse envoyée ; elle est en attente de validation.',
		myOffers: 'Mes offres',
		myOffersEmpty: 'Vous n’avez pas encore publié d’offre.',
		officialHeading: 'Publier une offre officielle',
		officialIntro:
			'L’offre sera publiée au nom de votre commerce affilié et portera le badge « Officielle ».'
	},
	admin: {
		title: "Panneau d'administration",
		subtitle: 'Modérez les offres et examinez les signalements de la communauté.',
		tabOffers: 'Offres',
		tabReports: 'Signalements',
		filterStatusLabel: 'Statut',
		filterStatusAll: 'Tous',
		thOffer: 'Offre',
		thAuthor: 'Auteur',
		thStatus: 'Statut',
		thScore: 'Points',
		thReports: 'Signalements',
		thActions: 'Actions',
		actionDisable: 'Désactiver',
		actionRestore: 'Restaurer',
		actionDisableAuthor: "Désactiver l'auteur",
		offersEmpty: 'Aucune offre ne correspond à ce filtre.',
		loadMore: 'Charger plus',
		actionError: "Nous n'avons pas pu effectuer l'action. Réessayez.",
		disableAuthorTitle: "Désactiver l'auteur",
		disableAuthorDescription:
			"L'auteur ne pourra plus se connecter et ses sessions actives seront révoquées. Continuer ?",
		disableAuthorConfirm: "Désactiver l'auteur",
		disableAuthorCancel: 'Annuler',
		disablingAuthor: 'Désactivation...',
		authorDisabledFeedback: 'Auteur désactivé.',
		thReason: 'Motif',
		thComment: 'Commentaire',
		thReporter: 'Signalé par',
		thReportedOffer: 'Offre',
		thDate: 'Date',
		reportsEmpty: 'Aucun signalement en attente.',
		noComment: 'Sans commentaire',
		tabComments: 'Commentaires',
		thContent: 'Commentaire',
		thNote: 'Note',
		actionHide: 'Masquer',
		actionDismiss: 'Rejeter',
		actionDismissReports: 'Rejeter les signalements',
		commentsEmpty: 'Aucun commentaire dans la file de modération.',
		viewReports: 'Voir les signalements',
		hideReports: 'Masquer les signalements',
		noteEmpty: 'Sans note',
		brand: 'Modération',
		tabDashboard: 'Aperçu',
		dashboardTitle: 'Aperçu de la modération',
		dashboardSubtitle: 'État des files et accès rapides.',
		statPendingComments: 'Commentaires à examiner',
		statPendingReports: 'Offres signalées',
		statTotalPending: 'Total en attente',
		statAllClear: 'Tout est à jour. Rien en attente.',
		queuesTitle: 'Files de modération',
		viewQueue: 'Ouvrir la file',
		tabMerchants: 'Commerces',
		merchantsSection: 'Commerces à vérifier',
		locationsSection: 'Adresses à vérifier',
		thMerchant: 'Commerce',
		thAddress: 'Adresse',
		thCreated: 'Créé',
		actionVerify: 'Vérifier',
		actionMerge: 'Fusionner',
		viewMap: 'Voir la carte',
		hideMap: 'Masquer la carte',
		verifying: 'Vérification...',
		merchantsEmpty: 'Aucun commerce en attente de vérification.',
		locationsEmpty: 'Aucune adresse en attente de vérification.',
		mergeTitle: 'Fusionner le commerce',
		mergeDescription:
			'Déplace les adresses et offres de « {name} » vers un autre commerce et supprime le doublon.',
		mergeTargetLabel: 'Commerce cible',
		mergeTargetPlaceholder: 'Rechercher le commerce à conserver',
		mergeConfirm: 'Fusionner',
		mergeSubmitting: 'Fusion...',
		mergeCancel: 'Annuler',
		searchPlaceholder: 'Rechercher un commerce...',
		filterPending: 'En attente',
		filterVerified: 'Vérifiés',
		filterBlocked: 'Bloqués',
		filterAll: 'Tous',
		statusVerified: 'Vérifié',
		statusBlocked: 'Bloqué',
		actionEdit: 'Modifier',
		actionBlock: 'Bloquer',
		actionUnblock: 'Débloquer',
		actionDelete: 'Supprimer',
		cancel: 'Annuler',
		save: 'Enregistrer',
		saving: 'Enregistrement...',
		deleting: 'Suppression...',
		editMerchantTitle: 'Modifier le commerce',
		merchantNameLabel: 'Nom du commerce',
		editLocationTitle: 'Modifier l’adresse',
		regionLabel: 'Région',
		deleteLocationTitle: 'Supprimer l’adresse',
		deleteLocationDesc: 'Supprimer l’adresse « {address} » ? Cette action est irréversible.',
		reassignHint:
			'Cette adresse a des offres associées. Choisis une autre adresse du même commerce pour les réassigner avant la suppression.',
		reassignLabel: 'Réassigner les offres à',
		reassignNone: 'Pas de réassignation',
		viewAddresses: 'Adresses',
		hideAddresses: 'Masquer les adresses',
		merchantAddressesEmpty: 'Ce commerce n’a pas encore d’adresse.',
		tabAccounts: 'Comptes',
		tabClaims: 'Affiliations',
		accountsSubtitle: 'Créez, modifiez et désactivez tous les comptes, dont ceux des entreprises.',
		claimsSubtitle:
			'Approuvez ou refusez les demandes d’affiliation des entreprises à leur commerce.',
		searchAccountsPlaceholder: 'Rechercher par e-mail ou utilisateur...',
		filterAllRoles: 'Tous les rôles',
		filterAllTypes: 'Tous les types',
		accountTypeIndividual: 'Particulier',
		accountTypeBusiness: 'Entreprise',
		statusDisabled: 'Désactivé',
		thAccount: 'Compte',
		thRole: 'Rôle',
		thType: 'Type',
		createAccount: 'Créer un compte',
		editAccountTitle: 'Modifier le compte',
		emailLabel: 'E-mail',
		usernameLabel: 'Nom d’utilisateur',
		passwordLabel: 'Mot de passe provisoire',
		passwordHint: 'Au moins 8 caractères ; le titulaire devra le changer.',
		newPasswordLabel: 'Nouveau mot de passe (optionnel)',
		affiliateMerchantLabel: 'Commerce à affilier (optionnel)',
		affiliateMerchantPlaceholder: 'Rechercher le commerce de l’entreprise',
		affiliateMerchantHint:
			'L’affiliation est approuvée immédiatement : le commerce devient le sien.',
		accountsEmpty: 'Aucun compte correspondant.',
		claimStatusPending: 'En attente',
		claimStatusApproved: 'Approuvée',
		claimStatusRejected: 'Refusée',
		claimsEmpty: 'Aucune demande d’affiliation.',
		actionApprove: 'Approuver',
		actionReject: 'Refuser',
		rejectTitle: 'Refuser l’affiliation',
		rejectDescription: 'Refuse la demande de « {user} » pour le commerce « {merchant} ».',
		rejectNoteLabel: 'Motif (optionnel)',
		reviewedBy: 'Examinée par'
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
		invalidCredentials: 'E-mail ou mot de passe incorrect. Vérifiez vos informations et réessayez.',
		duplicateEmail: 'Cet e-mail est déjà enregistré. Utilisez-en un autre ou connectez-vous.',
		duplicateUsername: "Ce nom d'utilisateur existe déjà. Choisissez-en un autre.",
		invalidEmail: 'Saisissez une adresse e-mail valide.',
		usernameRequired: "Saisissez un nom d'utilisateur.",
		passwordTooShort: 'Le mot de passe doit contenir au moins 8 caractères.',
		validationError: 'Vérifiez les champs du formulaire et réessayez.',
		genericLoginError: "Nous n'avons pas pu vous connecter pour le moment.",
		genericRegisterError: "Nous n'avons pas pu créer votre compte pour le moment.",
		genericUpdateError: "Nous n'avons pas pu mettre à jour ton profil pour le moment.",
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
		votes: 'Votes',
		reputation: 'Réputation',
		myOffers: 'Mes offres',
		myComments: 'Mes commentaires',
		myVotes: 'Mes votes',
		noOffers: "Vous n'avez pas encore publié d'offres.",
		noOffersDescription: 'Publiez votre première offre pour la voir apparaître ici.',
		noComments: "Vous n'avez encore commenté aucune offre.",
		noVotes: "Tu n'as encore voté pour aucune offre.",
		publishOffer: 'Publier une offre',
		offerActions: "Actions de l'offre",
		retry: 'Réessayer',
		editProfile: 'Modifier le profil',
		newPasswordLabel: 'Nouveau mot de passe',
		newPasswordHint: 'Laisse vide pour ne pas le changer.',
		currentPasswordLabel: 'Mot de passe actuel',
		save: 'Enregistrer',
		saving: 'Enregistrement...',
		cancel: 'Annuler',
		updateSuccess: 'Profil mis à jour.'
	},
	offer: {
		genericBrowseError: "Nous n'avons pas pu charger les offres pour le moment.",
		genericCreateError: "Nous n'avons pas pu créer l'offre pour le moment.",
		genericUpdateError: "Nous n'avons pas pu mettre à jour l'offre pour le moment.",
		genericDeleteError: "Nous n'avons pas pu supprimer l'offre pour le moment.",
		genericVoteError: "Nous n'avons pas pu enregistrer votre vote pour le moment.",
		genericReportError: "Nous n'avons pas pu enregistrer votre signalement pour le moment.",
		genericCommentError:
			"Nous n'avons pas pu effectuer l'action sur le commentaire pour le moment.",
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
		typeLocal: 'Physique',
		verified: 'Vérifié',
		official: 'Officielle',
		nearMe: 'Près de moi',
		expiresOn: 'Expire',
		filterCity: 'Ville',
		filterType: 'Canal',
		filterCategory: 'Catégorie',
		allCities: 'Toutes les villes',
		allTypes: 'Tous les canaux',
		allCategories: 'Toutes les catégories',
		sortRecent: 'Plus récentes',
		sortPopular: 'Plus populaires',
		sortEnding: 'Bientôt finies',
		hideExpired: 'Masquer expirées',
		periodAll: 'Toujours',
		periodDay: "Aujourd'hui",
		periodWeek: 'Cette semaine',
		periodMonth: 'Ce mois-ci',
		periodYear: 'Cette année',
		listingTitle: 'Toutes les offres',
		resultsCount: '{count} résultats',
		resultsHeading: 'Résultats',
		searchResultsFor: 'Résultats pour',
		clearSearch: 'Effacer la recherche',
		loadMore: 'Charger plus',
		empty: 'Aucune offre ne correspond à vos filtres.'
	},
	categories: {
		technology: 'Technologie',
		home: 'Maison',
		fashion: 'Mode',
		groceries: 'Courses',
		restaurants: 'Restaurants',
		travel: 'Voyages',
		entertainment: 'Divertissement',
		beauty: 'Beauté',
		sports: 'Sport',
		kids: 'Enfants',
		services: 'Services',
		other: 'Autres'
	},
	createDeal: {
		pageTitle: 'Partager une offre',
		heading: 'Partager une offre',
		intro:
			'Publiez une réduction claire pour que la communauté puisse la trouver, voter et en profiter.',
		titleLabel: 'Titre',
		titlePlaceholder: 'Ex. 40 % de réduction sur des écouteurs',
		descriptionLabel: 'Description',
		descriptionPlaceholder:
			"Décrivez l'offre, les conditions importantes, la disponibilité et les étapes pour en profiter.",
		offerTypeLabel: "Type d'offre",
		offerTypePlaceholder: 'Choisis un type',
		offerNature: {
			discount: 'Réduction',
			'2x1': '2 pour 1',
			coupon: 'Coupon',
			cashback: 'Cashback',
			clearance: 'Déstockage',
			free_shipping: 'Livraison gratuite',
			other: 'Autre'
		},
		categoriesLabel: 'Catégories',
		isOnlineLabel: 'Offre en ligne',
		isOnlineHint: 'Sans magasin physique : indique le lien pour en profiter.',
		externalUrlLabel: "Lien de l'offre",
		externalUrlPlaceholder: 'https://magasin.com/offre',
		externalUrlHint: 'Optionnel pour les offres physiques.',
		externalUrlHintOnline: 'Obligatoire pour les offres en ligne.',
		merchantLabel: 'Commerce',
		merchantPlaceholder: 'Nom du commerce',
		merchantLockedHint: 'Les offres officielles sont publiées avec votre commerce affilié.',
		merchantSearching: 'Recherche…',
		merchantVerified: 'Vérifié',
		merchantCreateLabel: 'Ajouter un nouveau commerce',
		cityLabel: 'Ville',
		cityPlaceholder: 'Ex. Bogotá',
		addressLabel: 'Adresse',
		addressPlaceholder: 'Ex. 12 rue de la Paix',
		addressHint: "Nous géolocalisons l'adresse pour situer l'offre.",
		mapHint: "Déplace l'épingle ou touche la carte pour ajuster l'emplacement exact.",
		startDateLabel: 'Date de début',
		endDateLabel: 'Date de fin',
		requiredHint: 'Tous les champs marqués sont obligatoires.',
		submit: "Publier l'offre",
		submitting: 'Publication...',
		genericError: "Nous n'avons pas pu publier l'offre. Vérifiez les informations et réessayez."
	},
	editDeal: {
		pageTitle: "Modifier l'offre",
		heading: 'Modifier votre offre',
		intro:
			'Mettez à jour les informations importantes pour que la communauté dispose de détails clairs et utiles.',
		submit: 'Enregistrer les changements',
		submitting: 'Enregistrement...',
		genericError:
			"Nous n'avons pas pu mettre à jour l'offre. Vérifiez les informations et réessayez."
	},
	deleteDeal: {
		openButton: 'Supprimer',
		title: "Supprimer l'offre",
		description: "Cette action est définitive. L'offre disparaîtra de la liste publique.",
		cancel: 'Annuler',
		confirm: 'Supprimer définitivement',
		deleting: 'Suppression...',
		genericError: "Nous n'avons pas pu supprimer l'offre. Réessayez."
	},
	home: {
		heroEyebrow: 'La communauté des bons plans en Colombie',
		heroTitle: 'Découvrez les meilleures offres en Colombie',
		heroSubtitle:
			'Rejoignez la plus grande communauté de chasseurs de bonnes affaires du pays. Trouvez, partagez et votez pour les meilleurs rabais en magasin et en ligne.',
		exploreCta: 'Explorer les offres',
		publishCta: 'Partager une réduction',
		hotDealsTitle: 'Offres en feu',
		recentDealsTitle: 'Récemment ajoutées',
		viewAll: 'Voir toutes'
	},
	comments: {
		title: 'Commentaires',
		placeholder: 'Écrivez un commentaire...',
		submit: 'Commenter',
		submitting: 'Envoi...',
		empty: 'Soyez le premier à commenter.',
		loadMore: 'Voir plus de commentaires',
		edited: '(modifié)',
		reply: 'Répondre',
		replyingTo: 'En réponse à @{username}',
		replyPlaceholder: 'Écrivez une réponse...',
		viewReplies: 'Voir les réponses ({count})',
		hideReplies: 'Masquer les réponses',
		loadMoreReplies: 'Voir plus de réponses',
		edit: 'Modifier',
		save: 'Enregistrer',
		saving: 'Enregistrement...',
		cancel: 'Annuler',
		delete: 'Supprimer',
		deleteConfirm: 'Supprimer ce commentaire ?',
		deletedPlaceholderAuthor: "[supprimé par l'auteur]",
		hiddenPlaceholderModerator: '[masqué par un modérateur]',
		report: 'Signaler',
		reported: 'Signalé',
		reportTitle: 'Signaler le commentaire',
		reportDescription: 'Indiquez pourquoi ce commentaire devrait être examiné.',
		reportReasonLabel: 'Motif',
		reportReasonPlaceholder: 'Sélectionnez un motif',
		reportNoteLabel: 'Note',
		reportNotePlaceholder: 'Ajoutez des détails pour la modération (optionnel)',
		reportNoteHint: 'Optionnel',
		reportSubmit: 'Envoyer le signalement',
		reportSubmitting: 'Envoi...',
		reportSuccess: 'Signalement envoyé. Merci.',
		reportGenericError: "Nous n'avons pas pu envoyer le signalement. Réessayez.",
		reportReasons: {
			SPAM: 'Spam',
			ABUSE: 'Harcèlement ou abus',
			OFF_TOPIC: 'Hors sujet',
			MISINFORMATION: 'Désinformation',
			OTHER: 'Autre'
		}
	},
	footer: {
		rights: 'Tous droits réservés.',
		terms: 'Conditions',
		privacy: 'Confidentialité'
	},
	legal: {
		lastUpdated: 'Dernière mise à jour : juin 2026',
		backHome: "Retour à l'accueil",
		terms: {
			title: 'Conditions générales',
			intro: 'En utilisant Ofertando, tu acceptes ces conditions. Lis-les attentivement.',
			sections: [
				{
					heading: 'Le service',
					body: 'Ofertando est une plateforme communautaire où les gens partagent, commentent et votent pour des offres et des réductions. Nous ne vendons pas de produits : nous facilitons seulement l’échange d’informations entre utilisateurs.'
				},
				{
					heading: 'Ton compte',
					body: 'Tu es responsable de la confidentialité de tes identifiants et de l’activité de ton compte. Nous pouvons désactiver les comptes qui enfreignent ces conditions.'
				},
				{
					heading: 'Contenu et conduite',
					body: 'Tu es responsable des offres et des commentaires que tu publies. Le contenu indésirable, trompeur, illégal ou abusif est interdit ; notre équipe de modération peut masquer ou supprimer du contenu et traiter les signalements de la communauté.'
				},
				{
					heading: 'À propos des offres',
					body: 'Les offres sont soumises par la communauté et peuvent changer ou expirer sans préavis. Vérifie toujours le prix, les conditions et la disponibilité en boutique avant d’acheter ; nous ne garantissons pas leur exactitude.'
				},
				{
					heading: 'Modifications',
					body: 'Nous pouvons mettre à jour ces conditions pour refléter des améliorations du service ou des exigences légales. L’utilisation continue d’Ofertando vaut acceptation de la version en vigueur.'
				}
			]
		},
		privacy: {
			title: 'Politique de confidentialité',
			intro:
				'Chez Ofertando, nous prenons soin de tes données. Voici ce que nous collectons et comment nous l’utilisons.',
			sections: [
				{
					heading: 'Données que nous collectons',
					body: 'Pour créer ton compte, nous conservons ton adresse e-mail et ton nom d’utilisateur. Nous enregistrons aussi ton activité sur la plateforme : offres, commentaires et votes.'
				},
				{
					heading: 'Comment nous utilisons tes données',
					body: 'Nous utilisons tes données pour fournir le service, afficher ton activité sur ton profil et permettre la modération de la communauté. Nous ne vendons pas tes données à des tiers.'
				},
				{
					heading: 'Cookies et session',
					body: 'Nous utilisons un cookie de session strictement nécessaire pour te garder connecté en toute sécurité. Nous n’utilisons pas de cookies publicitaires ou de suivi.'
				},
				{
					heading: 'Tes droits',
					body: 'Tu peux consulter et modifier ton nom d’utilisateur, ton e-mail et ton mot de passe depuis ton profil à tout moment.'
				},
				{
					heading: 'Modifications',
					body: 'Nous pouvons mettre à jour cette politique. Nous publierons tout changement sur cette même page.'
				}
			]
		}
	},
	report: {
		modalTitle: 'Signaler cette offre',
		modalDescription: 'Indiquez-nous pourquoi cette offre devrait être examinée.',
		reasonLabel: 'Motif',
		reasonPlaceholder: 'Sélectionnez un motif',
		commentLabel: 'Commentaire',
		commentPlaceholder: 'Ajoutez des détails utiles à la modération (optionnel)',
		commentHint: 'Optionnel',
		submit: 'Envoyer le signalement',
		submitting: 'Envoi...',
		cancel: 'Annuler',
		alreadyReported: 'Déjà signalée',
		expiredHint: 'Vous ne pouvez pas signaler une offre expirée',
		genericError: "Nous n'avons pas pu envoyer le signalement. Réessayez.",
		reasons: {
			EXPIRED: 'Offre expirée',
			UNAVAILABLE: 'Produit indisponible',
			INCORRECT_INFO: 'Informations incorrectes',
			SCAM: 'Arnaque',
			OTHER: 'Autre'
		}
	},
	deal: {
		goToStore: 'Aller au magasin',
		edit: 'Modifier',
		report: 'Signaler',
		share: 'Partager',
		shareCopied: 'Lien copié',
		publishedBy: 'Publié par',
		locationTitle: 'Emplacement',
		relatedTitle: 'Offres similaires',
		relatedEmpty: "Pas d'offres similaires pour le moment.",
		expiredBanner: 'Cette offre a expiré.',
		disabledBanner: 'Cette offre a été désactivée par un administrateur.',
		reportedBanner: 'Cette offre est en cours de vérification par la modération.'
	},
	errors: {
		'auth.unauthorized': 'Votre session a expiré. Reconnectez-vous.',
		'auth.forbidden': "Vous n'avez pas la permission d'effectuer cette action.",
		'auth.forbidden_root': "Cette section requiert les permissions d'administrateur racine.",
		'auth.invalid_credentials':
			'E-mail ou mot de passe incorrect. Vérifiez vos informations et réessayez.',
		'auth.account_disabled': 'Votre compte est désactivé. Contactez le support.',
		'user.email_taken': 'Cet e-mail est déjà enregistré. Utilisez-en un autre ou connectez-vous.',
		'user.username_taken': "Ce nom d'utilisateur existe déjà. Choisissez-en un autre.",
		'user.current_password_required':
			'Saisis ton mot de passe actuel pour confirmer le changement.',
		'user.invalid_current_password': 'Le mot de passe actuel est incorrect.',
		'account.not_found': "Le compte n'existe pas.",
		'account.not_business': "Le compte n'est pas un compte entreprise.",
		'account.no_affiliation': "Le compte entreprise n'a pas encore de commerce affilié.",
		'claim.not_found': "La demande d'affiliation n'existe pas.",
		'claim.already_resolved': "La demande d'affiliation a déjà été traitée.",
		'claim.user_already_affiliated': 'Cette entreprise a déjà un commerce affilié.',
		'offer.not_found': "Nous n'avons pas trouvé cette offre. Elle a peut-être été supprimée.",
		'offer.forbidden': "Vous n'avez pas la permission de modifier cette offre.",
		'offer.invalid_dates':
			'Dates invalides : la date de fin doit être après la date de début et dans le futur.',
		'offer.invalid_status_transition': 'Cette offre ne peut plus être modifiée.',
		'offer.invalid_category': 'Choisis au moins une catégorie valide.',
		'offer.online_requires_url': 'Les offres en ligne nécessitent un lien.',
		'offer.location_required': 'Les offres physiques nécessitent une adresse.',
		'offer.invalid_near': "Nous n'avons pas pu utiliser ta position. Réessaie.",
		'vote.offer_not_voteable':
			"Vous ne pouvez pas voter sur cette offre car elle n'est plus active.",
		'report.offer_not_reportable':
			"Vous ne pouvez pas signaler cette offre car elle n'est plus active.",
		'comment.not_found': "Nous n'avons pas trouvé ce commentaire. Il a peut-être été supprimé.",
		'comment.forbidden': "Vous n'avez pas la permission de modifier ce commentaire.",
		'comment.offer_not_commentable': 'Vous ne pouvez pas commenter cette offre pour le moment.',
		'comment.not_reportable': 'Ce commentaire ne peut plus être signalé.',
		'comment.invalid_status_transition': "Cette action n'est plus possible sur ce commentaire.",
		'merchant.not_found': "Nous n'avons pas trouvé ce commerce.",
		'merchant.name_taken': 'Un commerce porte déjà ce nom ; utilise la fusion.',
		'merchant.merge_invalid': 'Ces commerces ne peuvent pas être fusionnés.',
		'merchant.already_owned': 'Ce commerce a déjà un propriétaire.',
		'location.not_found': "Nous n'avons pas trouvé cette adresse.",
		'location.in_use': 'Cette adresse a des offres ; réassigne-les avant de la supprimer.',
		'geocoding.unavailable':
			"Nous n'avons pas pu rechercher l'adresse pour le moment. Réessaie plus tard.",
		'pagination.invalid_cursor': 'La pagination a expiré. Nous repartons depuis la première page.',
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
			categoryIds: {
				isNotEmpty: 'Choisis au moins une catégorie.'
			},
			externalUrl: {
				isString: 'Le lien doit être une chaîne de caractères.',
				isUrl: 'Saisissez une URL valide.'
			},
			merchantName: {
				isString: 'Le nom du commerce doit être une chaîne de caractères.',
				isNotEmpty: 'Saisissez le nom du commerce.',
				maxLength: 'Le nom du commerce est trop long (100 caractères maximum).'
			},
			locationCity: {
				isString: 'La ville doit être une chaîne de caractères.',
				isNotEmpty: 'Saisissez une ville.',
				unknownCity: 'Choisis une ville dans la liste.'
			},
			locationAddress: {
				isString: "L'adresse doit être une chaîne de caractères.",
				isNotEmpty: 'Saisissez et sélectionnez une adresse.',
				maxLength: "L'adresse est trop longue (200 caractères maximum)."
			},
			startDate: {
				isDateString: 'Date de début invalide (format ISO 8601 attendu).',
				isInFuture: 'La date de début doit être dans le futur.'
			},
			endDate: {
				isDateString: 'Date de fin invalide (format ISO 8601 attendu).',
				isAfterStart: 'La date de fin doit être postérieure à la date de début.',
				isInFuture: 'La date de fin doit être dans le futur.'
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
};
