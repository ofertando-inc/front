import type { Offer } from '$lib/types/offer';

export const MOCK_OFFERS: Offer[] = [
	{
		id: '1',
		title: 'Samsung Galaxy S24 - 30% de descuento',
		description:
			'Aprovecha este increíble descuento en el nuevo Samsung Galaxy S24. Válido solo por este fin de semana pagando con tarjetas seleccionadas. Incluye envío gratis a nivel nacional.',
		offerType: 'online',
		externalUrl: 'https://example.com/deal1',
		storeName: 'Falabella',
		city: 'Bogotá',
		startDate: '2026-04-25T10:00:00.000Z',
		endDate: '2026-05-01T23:59:59.000Z',
		status: 'ACTIVE',
		score: 142,
		reportCount: 0,
		createdAt: '2026-04-25T10:00:00.000Z',
		updatedAt: '2026-04-25T10:00:00.000Z',
		createdById: 'mock-user-carlos'
	},
	{
		id: '2',
		title: 'PlayStation 5 Slim a $1.899.000',
		description:
			'Excelente precio para la PS5 Slim en tiendas físicas. Hay pocas unidades disponibles, recomiendo ir temprano. Visto en la sede de El Poblado.',
		offerType: 'local',
		externalUrl: 'https://example.com/deal2',
		storeName: 'Alkosto',
		city: 'Medellín',
		startDate: '2026-04-26T08:30:00.000Z',
		endDate: '2026-04-30T23:59:59.000Z',
		status: 'ACTIVE',
		score: 89,
		reportCount: 0,
		createdAt: '2026-04-26T08:30:00.000Z',
		updatedAt: '2026-04-26T08:30:00.000Z',
		createdById: 'mock-user-gamer'
	},
	{
		id: '3',
		title: 'Combo familiar Hamburguesas 2x1',
		description:
			'Promoción 2x1 en combos familiares presentando el cupón de la app en cualquier sede de la ciudad. Aplica para consumo en el local o para llevar.',
		offerType: 'local',
		externalUrl: 'https://example.com/deal3',
		storeName: 'El Corral',
		city: 'Cali',
		startDate: '2026-04-27T12:15:00.000Z',
		endDate: '2026-04-28T23:59:59.000Z',
		status: 'ACTIVE',
		score: 67,
		reportCount: 0,
		createdAt: '2026-04-27T12:15:00.000Z',
		updatedAt: '2026-04-27T12:15:00.000Z',
		createdById: 'mock-user-foodie'
	},
	{
		id: '4',
		title: 'Vuelos nacionales desde $99.000',
		description:
			'Promoción relámpago para vuelos nacionales comprando hoy para viajar entre junio y noviembre. Tarifas sujetas a disponibilidad.',
		offerType: 'online',
		externalUrl: 'https://example.com/deal4',
		storeName: 'Wingo',
		city: 'Nacional',
		startDate: '2026-04-27T09:00:00.000Z',
		endDate: '2026-04-27T23:59:59.000Z',
		status: 'ACTIVE',
		score: 203,
		reportCount: 0,
		createdAt: '2026-04-27T09:00:00.000Z',
		updatedAt: '2026-04-27T09:00:00.000Z',
		createdById: 'mock-user-viajero'
	},
	{
		id: '5',
		title: 'Smart TV LG 55" 4K UHD',
		description:
			'Televisor LG de 55 pulgadas con panel 4K a precio de locura. Solo aplica para compras por la página web. Unidades limitadas.',
		offerType: 'online',
		externalUrl: 'https://example.com/deal5',
		storeName: 'Éxito',
		city: 'Nacional',
		startDate: '2026-04-15T14:20:00.000Z',
		endDate: '2026-04-20T23:59:59.000Z',
		status: 'EXPIRED',
		score: -12,
		reportCount: 0,
		createdAt: '2026-04-15T14:20:00.000Z',
		updatedAt: '2026-04-20T23:59:59.000Z',
		createdById: 'mock-user-tech'
	},
	{
		id: '6',
		title: 'Tenis Nike Air Max 50% OFF',
		description:
			'Descuento en referencias seleccionadas de Nike Air Max en la tienda oficial de MercadoLibre. Tallas sujetas a inventario.',
		offerType: 'online',
		externalUrl: 'https://example.com/deal6',
		storeName: 'MercadoLibre',
		city: 'Nacional',
		startDate: '2026-04-26T16:45:00.000Z',
		endDate: '2026-05-10T23:59:59.000Z',
		status: 'REPORTED',
		score: 45,
		reportCount: 3,
		createdAt: '2026-04-26T16:45:00.000Z',
		updatedAt: '2026-04-26T16:45:00.000Z',
		createdById: 'mock-user-sneakerhead'
	},
	{
		id: '7',
		title: 'Mercado con 20% de descuento pagando con Tarjeta Cencosud',
		description:
			'Descuento en toda la tienda pagando con la tarjeta de crédito Cencosud. No aplica para licores ni tecnología.',
		offerType: 'local',
		externalUrl: 'https://example.com/deal7',
		storeName: 'Jumbo',
		city: 'Barranquilla',
		startDate: '2026-04-27T10:30:00.000Z',
		endDate: '2026-05-05T23:59:59.000Z',
		status: 'ACTIVE',
		score: 34,
		reportCount: 0,
		createdAt: '2026-04-27T10:30:00.000Z',
		updatedAt: '2026-04-27T10:30:00.000Z',
		createdById: 'mock-user-ahorrador'
	},
	{
		id: '8',
		title: 'Suscripción Spotify Premium 3 meses por $1.000',
		description:
			'Oferta para cuentas nuevas. 3 meses de Spotify Premium por solo $1.000 COP. Cancela cuando quieras.',
		offerType: 'online',
		externalUrl: 'https://example.com/deal8',
		storeName: 'Spotify',
		city: 'Nacional',
		startDate: '2026-04-20T08:00:00.000Z',
		endDate: '2026-05-31T23:59:59.000Z',
		status: 'ACTIVE',
		score: 312,
		reportCount: 0,
		createdAt: '2026-04-20T08:00:00.000Z',
		updatedAt: '2026-04-20T08:00:00.000Z',
		createdById: 'mock-user-music'
	},
	{
		id: '9',
		title: 'Portátil Asus Vivobook Ryzen 7',
		description:
			'Excelente equipo para trabajo y estudio. Ryzen 7, 16GB RAM, 512GB SSD. Precio sospechosamente bajo, tener precaución.',
		offerType: 'online',
		externalUrl: 'https://example.com/deal9',
		storeName: 'Tienda Desconocida',
		city: 'Nacional',
		startDate: '2026-04-27T07:00:00.000Z',
		endDate: '2026-05-01T23:59:59.000Z',
		status: 'DISABLED',
		score: -45,
		reportCount: 12,
		createdAt: '2026-04-27T07:00:00.000Z',
		updatedAt: '2026-04-28T10:00:00.000Z',
		createdById: 'mock-user-new'
	}
];

export const MOCK_POPULAR_STORES = [
	'Éxito',
	'Falabella',
	'MercadoLibre',
	'Alkosto',
	'Jumbo',
	'Amazon'
];
