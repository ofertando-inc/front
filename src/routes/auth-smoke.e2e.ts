import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { createServer, type Server } from 'node:http';

let mockBackend: Server;

function sendJson(response: import('node:http').ServerResponse, statusCode: number, body: unknown) {
	response.writeHead(statusCode, { 'Content-Type': 'application/json' });
	response.end(JSON.stringify(body));
}

function isAuthenticated(request: import('node:http').IncomingMessage) {
	const cookie = request.headers.cookie ?? '';
	return (
		cookie.includes('e2e_session=authenticated') ||
		cookie.includes('e2e_session=admin') ||
		cookie.includes('e2e_session=root') ||
		cookie.includes('e2e_session=business') ||
		cookie.includes('e2e_session=bizpending')
	);
}

// Affiliated business account (approved claim on MarcaOficial).
function isBusiness(request: import('node:http').IncomingMessage) {
	return (request.headers.cookie ?? '').includes('e2e_session=business');
}

// Business account still waiting for its affiliation to be approved.
function isBizPending(request: import('node:http').IncomingMessage) {
	return (request.headers.cookie ?? '').includes('e2e_session=bizpending');
}

async function readJsonBody(request: import('node:http').IncomingMessage): Promise<unknown> {
	const chunks: Buffer[] = [];
	for await (const chunk of request) chunks.push(chunk as Buffer);
	if (chunks.length === 0) return {};
	try {
		return JSON.parse(Buffer.concat(chunks).toString('utf8'));
	} catch {
		return {};
	}
}

// ROOT is a superset of ADMIN for the moderation surfaces.
function isAdmin(request: import('node:http').IncomingMessage) {
	const cookie = request.headers.cookie ?? '';
	return cookie.includes('e2e_session=admin') || cookie.includes('e2e_session=root');
}

function isRoot(request: import('node:http').IncomingMessage) {
	return (request.headers.cookie ?? '').includes('e2e_session=root');
}

// Offer returned by POST /offers (and its GET) for the create happy-path test.
const createdOffer = {
	id: 'new-offer',
	title: 'Gran descuento de prueba',
	description: 'Una descripción de prueba suficientemente larga.',
	offerType: 'discount',
	isOnline: false,
	externalUrl: null,
	startDate: '2026-06-01T00:00:00.000Z',
	endDate: '2026-12-31T00:00:00.000Z',
	status: 'ACTIVE',
	score: 0,
	reportCount: 0,
	commentCount: 0,
	createdAt: '2026-06-01T10:00:00.000Z',
	updatedAt: '2026-06-01T10:00:00.000Z',
	createdById: 'e2e-user-id',
	createdByUsername: 'e2euser',
	userVote: null,
	categories: [{ id: 'cat-technology', slug: 'technology', name: 'Technology' }],
	merchant: { id: 'merchant-acme', name: 'Acme Store', verified: true },
	location: {
		id: 'loc-new',
		address: 'Calle 10 #20-30',
		city: 'Bogotá',
		region: 'Bogotá D.C.',
		latitude: 4.6,
		longitude: -74.08,
		verified: false
	}
};

test.beforeAll(async () => {
	mockBackend = createServer((request, response) => {
		const url = request.url ?? '/';

		if (url === '/health/live') {
			sendJson(response, 200, { status: 'ok' });
			return;
		}

		if (url === '/users/me/stats') {
			if (!isAuthenticated(request)) {
				sendJson(response, 401, { key: 'auth.unauthorized', statusCode: 401 });
				return;
			}
			sendJson(response, 200, { offerCount: 3, commentCount: 7 });
			return;
		}

		if (url === '/users/me/comments' || url.startsWith('/users/me/comments?')) {
			if (!isAuthenticated(request)) {
				sendJson(response, 401, { key: 'auth.unauthorized', statusCode: 401 });
				return;
			}
			sendJson(response, 200, {
				items: [
					{
						id: 'mc1',
						content: 'Mi comentario de prueba',
						createdAt: '2026-05-20T10:00:00.000Z',
						editedAt: null,
						score: 5,
						replyCount: 2,
						hidden: false,
						offer: { id: 'e2e-comment-offer', title: 'Oferta comentada' }
					}
				],
				nextCursor: null
			});
			return;
		}

		if (url === '/users/me/votes' || url.startsWith('/users/me/votes?')) {
			if (!isAuthenticated(request)) {
				sendJson(response, 401, { key: 'auth.unauthorized', statusCode: 401 });
				return;
			}
			sendJson(response, 200, {
				items: [
					{
						type: 'UP',
						createdAt: '2026-05-21T10:00:00.000Z',
						offer: { id: 'e2e-vote-offer', title: 'Oferta votada', score: 16 }
					}
				],
				nextCursor: null
			});
			return;
		}

		if (url === '/users/me' && request.method === 'PATCH') {
			if (!isAuthenticated(request)) {
				sendJson(response, 401, { key: 'auth.unauthorized', statusCode: 401 });
				return;
			}
			void readJsonBody(request).then((body) => {
				const patch = (body ?? {}) as { username?: unknown; email?: unknown };
				sendJson(response, 200, {
					id: 'e2e-user-id',
					email: typeof patch.email === 'string' ? patch.email : 'e2e@example.com',
					username: typeof patch.username === 'string' ? patch.username : 'e2euser',
					role: 'USER',
					status: 'ACTIVE',
					createdAt: '2026-05-01T10:00:00.000Z',
					reputation: 12,
					updatedAt: '2026-05-22T10:00:00.000Z'
				});
			});
			return;
		}

		if (url.startsWith('/users/me')) {
			if (isAuthenticated(request)) {
				const root = isRoot(request);
				const admin = isAdmin(request);
				const business = isBusiness(request) || isBizPending(request);
				sendJson(response, 200, {
					id: root
						? 'e2e-root-id'
						: admin
							? 'e2e-admin-id'
							: business
								? 'e2e-biz-id'
								: 'e2e-user-id',
					email: root
						? 'root@example.com'
						: admin
							? 'admin@example.com'
							: business
								? 'biz@example.com'
								: 'e2e@example.com',
					username: root ? 'e2eroot' : admin ? 'e2eadmin' : business ? 'e2ebiz' : 'e2euser',
					role: root ? 'ROOT' : admin ? 'ADMIN' : 'USER',
					accountType: business ? 'BUSINESS' : 'INDIVIDUAL',
					status: 'ACTIVE',
					reputation: 12,
					createdAt: '2026-05-01T10:00:00.000Z',
					updatedAt: '2026-05-01T10:00:00.000Z'
				});
				return;
			}

			sendJson(response, 401, {
				key: 'auth.unauthorized',
				statusCode: 401
			});
			return;
		}

		if (url.startsWith('/auth/refresh')) {
			sendJson(response, 401, {
				key: 'auth.unauthorized',
				statusCode: 401
			});
			return;
		}

		if (url === '/offers/mine' || url.startsWith('/offers/mine?')) {
			if (!isAuthenticated(request)) {
				sendJson(response, 401, {
					key: 'auth.unauthorized',
					statusCode: 401
				});
				return;
			}

			// The business dashboard lists the merchant's own offers (one online,
			// one physical) so the channel/address filter has something to chew on.
			if (isBusiness(request)) {
				const baseBizOffer = {
					offerType: 'discount',
					startDate: '2026-05-01T00:00:00.000Z',
					endDate: '2026-12-31T00:00:00.000Z',
					status: 'ACTIVE',
					score: 5,
					reportCount: 0,
					commentCount: 0,
					createdAt: '2026-05-10T10:00:00.000Z',
					updatedAt: '2026-05-10T10:00:00.000Z',
					createdById: 'e2e-biz-id',
					createdByUsername: 'e2ebiz',
					userVote: null,
					categories: [],
					merchant: { id: 'merchant-owned', name: 'MarcaOficial', verified: true, blocked: false },
					official: true,
					viewCount: 60,
					clickCount: 20
				};
				sendJson(response, 200, {
					items: [
						{
							...baseBizOffer,
							id: 'biz-online-offer',
							title: 'Oferta online oficial',
							description: 'Oferta en línea de la marca.',
							isOnline: true,
							externalUrl: 'https://example.com/online',
							location: null
						},
						{
							...baseBizOffer,
							id: 'biz-local-offer',
							title: 'Oferta local oficial',
							description: 'Oferta física de la marca.',
							isOnline: false,
							externalUrl: null,
							location: {
								id: 'loc-biz',
								address: 'Carrera 7 #45-10',
								city: 'Bogotá',
								region: 'Bogotá D.C.',
								latitude: 4.62,
								longitude: -74.07,
								verified: true
							}
						}
					],
					nextCursor: null,
					total: 2
				});
				return;
			}

			sendJson(response, 200, { items: [], nextCursor: null, total: 0 });
			return;
		}

		if (url === '/offers/facets') {
			sendJson(response, 200, { cities: [], categories: [] });
			return;
		}

		if (url === '/categories') {
			sendJson(response, 200, [
				{ id: 'cat-technology', slug: 'technology', name: 'Technology', order: 1 },
				{ id: 'cat-other', slug: 'other', name: 'Other', order: 12 }
			]);
			return;
		}

		if (url.startsWith('/geocode/reverse')) {
			sendJson(response, 200, {
				displayName: 'Carrera 7 #45-10, Bogotá, Colombia',
				latitude: 4.62,
				longitude: -74.07,
				city: 'Bogotá',
				region: 'Bogotá D.C.',
				address: 'Carrera 7 #45-10'
			});
			return;
		}

		if (url === '/geocode' || url.startsWith('/geocode?')) {
			sendJson(response, 200, [
				{
					displayName: 'Calle 10 #20-30, Bogotá, Colombia',
					latitude: 4.6,
					longitude: -74.08,
					city: 'Bogotá',
					region: 'Bogotá D.C.',
					address: 'Calle 10 #20-30'
				}
			]);
			return;
		}

		if (url === '/merchants' || url.startsWith('/merchants?')) {
			if (request.method === 'POST') {
				sendJson(response, 201, {
					id: 'merchant-new',
					name: 'Nuevo comercio',
					verified: false,
					createdAt: '2026-06-01T10:00:00.000Z'
				});
				return;
			}
			sendJson(response, 200, [
				{
					id: 'merchant-acme',
					name: 'Acme Store',
					verified: true,
					createdAt: '2026-05-01T10:00:00.000Z'
				}
			]);
			return;
		}

		if (url === '/offers' || url.startsWith('/offers?')) {
			if (request.method === 'POST') {
				sendJson(response, 201, createdOffer);
				return;
			}
			sendJson(response, 200, { items: [], nextCursor: null, total: 0 });
			return;
		}

		if (url === '/offers/new-offer' || url.startsWith('/offers/new-offer?')) {
			sendJson(response, 200, createdOffer);
			return;
		}

		const voteMatch = url.match(/^\/offers\/([^/?]+)\/votes(\/me)?(?:\?.*)?$/);
		if (voteMatch) {
			if (!isAuthenticated(request)) {
				sendJson(response, 401, { key: 'auth.unauthorized', statusCode: 401 });
				return;
			}

			const isMe = Boolean(voteMatch[2]);
			if (isMe) {
				sendJson(response, 200, { type: null });
				return;
			}

			if (request.method === 'DELETE') {
				sendJson(response, 200, { score: 15, userVote: null });
				return;
			}

			sendJson(response, 200, { score: 16, userVote: 'UP' });
			return;
		}

		const reportMatch = url.match(/^\/offers\/([^/?]+)\/reports(\/me)?(?:\?.*)?$/);
		if (reportMatch) {
			if (!isAuthenticated(request)) {
				sendJson(response, 401, { key: 'auth.unauthorized', statusCode: 401 });
				return;
			}

			const isMe = Boolean(reportMatch[2]);
			if (isMe) {
				sendJson(response, 200, { reason: null });
				return;
			}

			sendJson(response, 201, { status: 'REPORTED' });
			return;
		}

		const liveRoot = {
			id: 'c-live',
			content: 'Primer comentario de prueba',
			createdAt: '2026-05-20T10:00:00.000Z',
			editedAt: null,
			user: { id: 'other-user', username: 'otrousuario' },
			replyTo: null,
			score: 0,
			userVote: null,
			replyCount: 0,
			deleted: false,
			hidden: false
		};
		const tombstoneRoot = {
			id: 'c-tomb',
			content: null,
			createdAt: '2026-05-19T10:00:00.000Z',
			editedAt: null,
			user: { id: 'ghost', username: 'fantasma' },
			replyTo: null,
			score: 0,
			userVote: null,
			replyCount: 1,
			deleted: true,
			hidden: false
		};
		const hiddenRoot = {
			id: 'c-hidden',
			content: null,
			createdAt: '2026-05-18T10:00:00.000Z',
			editedAt: null,
			user: { id: 'troll', username: 'troll' },
			replyTo: null,
			score: 0,
			userVote: null,
			replyCount: 1,
			deleted: false,
			hidden: true
		};

		const repliesMatch = url.match(/^\/offers\/([^/?]+)\/comments\/([^/?]+)\/replies(?:\?.*)?$/);
		if (repliesMatch) {
			sendJson(response, 200, { items: [], nextCursor: null });
			return;
		}

		const commentReportsMatch = url.match(
			/^\/offers\/([^/?]+)\/comments\/([^/?]+)\/reports(\/me)?(?:\?.*)?$/
		);
		if (commentReportsMatch) {
			if (!isAuthenticated(request)) {
				sendJson(response, 401, { key: 'auth.unauthorized', statusCode: 401 });
				return;
			}
			if (commentReportsMatch[3]) {
				sendJson(response, 200, { reason: null });
				return;
			}
			sendJson(response, 200, { reportCount: 1 });
			return;
		}

		const votesMatch = url.match(/^\/offers\/([^/?]+)\/comments\/([^/?]+)\/votes(?:\?.*)?$/);
		if (votesMatch) {
			if (!isAuthenticated(request)) {
				sendJson(response, 401, { key: 'auth.unauthorized', statusCode: 401 });
				return;
			}
			if (request.method === 'DELETE') {
				sendJson(response, 200, { score: 0, userVote: null });
				return;
			}
			void readJsonBody(request).then((body) => {
				const type = (body as { type?: string }).type === 'DOWN' ? 'DOWN' : 'UP';
				sendJson(response, 200, { score: type === 'UP' ? 1 : -1, userVote: type });
			});
			return;
		}

		const commentMatch = url.match(/^\/offers\/([^/?]+)\/comments\/([^/?]+)(?:\?.*)?$/);
		if (commentMatch) {
			if (!isAuthenticated(request)) {
				sendJson(response, 401, { key: 'auth.unauthorized', statusCode: 401 });
				return;
			}
			sendJson(response, 200, {
				...liveRoot,
				id: commentMatch[2],
				content: request.method === 'DELETE' ? null : 'Comentario editado',
				editedAt: request.method === 'DELETE' ? null : '2026-05-21T10:00:00.000Z',
				deleted: request.method === 'DELETE',
				replyCount: 0
			});
			return;
		}

		const commentsMatch = url.match(/^\/offers\/([^/?]+)\/comments(?:\?.*)?$/);
		if (commentsMatch) {
			if (request.method === 'POST') {
				if (!isAuthenticated(request)) {
					sendJson(response, 401, { key: 'auth.unauthorized', statusCode: 401 });
					return;
				}
				void readJsonBody(request).then((body) => {
					const content = (body as { content?: string }).content ?? '';
					sendJson(response, 201, {
						id: 'c-new',
						content,
						createdAt: '2026-05-22T10:00:00.000Z',
						editedAt: null,
						user: { id: 'e2e-user-id', username: 'e2euser' },
						replyTo: null,
						score: 0,
						userVote: null,
						replyCount: 0,
						deleted: false,
						hidden: false
					});
				});
				return;
			}

			const seeded =
				commentsMatch[1] === 'e2e-comment-offer' ? [liveRoot, tombstoneRoot, hiddenRoot] : [];
			sendJson(response, 200, { items: seeded, nextCursor: null });
			return;
		}

		if (url === '/offers/e2e-comment-offer' || url.startsWith('/offers/e2e-comment-offer?')) {
			sendJson(response, 200, {
				id: 'e2e-comment-offer',
				title: 'Oferta de prueba de comentarios',
				description: 'Descripción de la oferta para el test de comentarios.',
				offerType: 'discount',
				isOnline: false,
				externalUrl: 'https://example.com/promo',
				merchant: { id: 'merchant-test', name: 'TestStore', verified: false },
				location: {
					id: 'loc-test',
					address: 'Calle 1 #2-3',
					city: 'Bogotá',
					region: null,
					latitude: null,
					longitude: null,
					verified: false
				},
				startDate: '2026-05-01T00:00:00.000Z',
				endDate: '2026-12-31T00:00:00.000Z',
				status: 'ACTIVE',
				score: 7,
				reportCount: 0,
				commentCount: 2,
				createdAt: '2026-05-01T10:00:00.000Z',
				updatedAt: '2026-05-01T10:00:00.000Z',
				createdById: 'other-author',
				createdByUsername: 'other-author',
				userVote: null,
				categories: []
			});
			return;
		}

		if (url === '/offers/e2e-report-offer' || url.startsWith('/offers/e2e-report-offer?')) {
			sendJson(response, 200, {
				id: 'e2e-report-offer',
				title: 'Oferta de prueba de reporte',
				description: 'Descripción de la oferta para el test de reporte.',
				offerType: 'discount',
				isOnline: false,
				externalUrl: 'https://example.com/promo',
				merchant: { id: 'merchant-test', name: 'TestStore', verified: false },
				location: {
					id: 'loc-test',
					address: 'Calle 1 #2-3',
					city: 'Bogotá',
					region: null,
					latitude: null,
					longitude: null,
					verified: false
				},
				startDate: '2026-05-01T00:00:00.000Z',
				endDate: '2026-12-31T00:00:00.000Z',
				status: 'ACTIVE',
				score: 0,
				reportCount: 0,
				commentCount: 2,
				createdAt: '2026-05-01T10:00:00.000Z',
				updatedAt: '2026-05-01T10:00:00.000Z',
				createdById: 'other-author',
				createdByUsername: 'other-author',
				userVote: null,
				categories: []
			});
			return;
		}

		if (url === '/offers/e2e-expired-offer' || url.startsWith('/offers/e2e-expired-offer?')) {
			// Status still ACTIVE but the endDate is in the past: the front must
			// treat it as expired via the OR-date rule, not the lagging status.
			sendJson(response, 200, {
				id: 'e2e-expired-offer',
				title: 'Oferta caducada de prueba',
				description: 'Descripción de la oferta caducada para el test.',
				offerType: 'discount',
				isOnline: false,
				externalUrl: 'https://example.com/promo',
				merchant: { id: 'merchant-test', name: 'TestStore', verified: false },
				location: {
					id: 'loc-test',
					address: 'Calle 1 #2-3',
					city: 'Bogotá',
					region: null,
					latitude: null,
					longitude: null,
					verified: false
				},
				startDate: '2020-01-01T00:00:00.000Z',
				endDate: '2020-02-01T00:00:00.000Z',
				status: 'ACTIVE',
				score: 3,
				reportCount: 0,
				commentCount: 5,
				createdAt: '2020-01-01T10:00:00.000Z',
				updatedAt: '2020-01-01T10:00:00.000Z',
				createdById: 'other-author',
				createdByUsername: 'other-author',
				userVote: null,
				categories: []
			});
			return;
		}

		if (url === '/offers/e2e-vote-offer' || url.startsWith('/offers/e2e-vote-offer?')) {
			sendJson(response, 200, {
				id: 'e2e-vote-offer',
				title: 'Oferta de prueba de votación',
				description: 'Descripción de la oferta para el test de votación.',
				offerType: 'discount',
				isOnline: false,
				externalUrl: 'https://example.com/promo',
				merchant: { id: 'merchant-test', name: 'TestStore', verified: false },
				location: {
					id: 'loc-test',
					address: 'Calle 1 #2-3',
					city: 'Bogotá',
					region: null,
					latitude: null,
					longitude: null,
					verified: false
				},
				startDate: '2026-05-01T00:00:00.000Z',
				endDate: '2026-12-31T00:00:00.000Z',
				status: 'ACTIVE',
				score: 15,
				reportCount: 0,
				commentCount: 0,
				createdAt: '2026-05-01T10:00:00.000Z',
				updatedAt: '2026-05-01T10:00:00.000Z',
				createdById: 'other-author',
				createdByUsername: 'other-author',
				userVote: null,
				categories: []
			});
			return;
		}

		const trackMatch = url.match(/^\/offers\/([^/?]+)\/(view|click)$/);
		if (trackMatch && request.method === 'POST') {
			response.writeHead(204);
			response.end();
			return;
		}

		if (url === '/offers/e2e-official-offer' || url.startsWith('/offers/e2e-official-offer?')) {
			sendJson(response, 200, {
				id: 'e2e-official-offer',
				title: 'Oferta oficial de la marca',
				description: 'Oferta publicada por la empresa dueña de la enseña.',
				offerType: 'discount',
				isOnline: true,
				externalUrl: 'https://example.com/oficial',
				merchant: { id: 'merchant-owned', name: 'MarcaOficial', verified: true, blocked: false },
				location: null,
				startDate: '2026-05-01T00:00:00.000Z',
				endDate: '2026-12-31T00:00:00.000Z',
				status: 'ACTIVE',
				score: 21,
				reportCount: 0,
				commentCount: 0,
				createdAt: '2026-05-01T10:00:00.000Z',
				updatedAt: '2026-05-01T10:00:00.000Z',
				createdById: 'business-user',
				createdByUsername: 'marcaoficial',
				userVote: null,
				categories: [],
				official: true,
				viewCount: 7,
				clickCount: 3
			});
			return;
		}

		if (url.startsWith('/offers/')) {
			sendJson(response, 404, {
				key: 'offer.not_found',
				statusCode: 404
			});
			return;
		}

		if (url.startsWith('/business/')) {
			if (!isAuthenticated(request)) {
				sendJson(response, 401, { key: 'auth.unauthorized', statusCode: 401 });
				return;
			}
			if (!isBusiness(request) && !isBizPending(request)) {
				sendJson(response, 403, { key: 'account.not_business', statusCode: 403 });
				return;
			}
			// Business account whose claim is still pending: every /business surface
			// answers 403 account.no_affiliation.
			if (isBizPending(request)) {
				sendJson(response, 403, { key: 'account.no_affiliation', statusCode: 403 });
				return;
			}

			if (url === '/business/me') {
				sendJson(response, 200, {
					user: {
						id: 'e2e-biz-id',
						email: 'biz@example.com',
						username: 'e2ebiz',
						role: 'USER',
						accountType: 'BUSINESS',
						status: 'ACTIVE',
						reputation: 12,
						createdAt: '2026-05-01T10:00:00.000Z',
						updatedAt: '2026-05-01T10:00:00.000Z'
					},
					merchant: {
						id: 'merchant-owned',
						name: 'MarcaOficial',
						verified: true,
						blockedAt: null,
						createdAt: '2026-05-01T10:00:00.000Z'
					},
					claim: {
						id: 'claim-approved',
						status: 'APPROVED',
						createdAt: '2026-05-02T10:00:00.000Z',
						resolvedAt: '2026-05-03T10:00:00.000Z'
					}
				});
				return;
			}

			if (url === '/business/stats') {
				sendJson(response, 200, {
					offers: { total: 4, active: 3 },
					views: 120,
					clicks: 45,
					score: 31,
					comments: 12,
					reports: 1
				});
				return;
			}

			if (url === '/business/offers' && request.method === 'POST') {
				sendJson(response, 201, {
					...createdOffer,
					merchant: { id: 'merchant-owned', name: 'MarcaOficial', verified: true, blocked: false },
					official: true,
					viewCount: 0,
					clickCount: 0
				});
				return;
			}

			if (url === '/business/locations' && request.method === 'POST') {
				void readJsonBody(request).then((body) => {
					const dto = (body ?? {}) as { address?: unknown; city?: unknown };
					sendJson(response, 201, {
						id: 'loc-requested',
						merchantId: 'merchant-owned',
						address: typeof dto.address === 'string' ? dto.address : 'Calle 10',
						city: typeof dto.city === 'string' ? dto.city : 'Bogotá',
						region: null,
						latitude: null,
						longitude: null,
						verified: false,
						createdAt: '2026-06-25T10:00:00.000Z'
					});
				});
				return;
			}

			sendJson(response, 404, { key: 'error.not_found', statusCode: 404 });
			return;
		}

		if (url.startsWith('/admin/')) {
			if (!isAuthenticated(request)) {
				sendJson(response, 401, { key: 'auth.unauthorized', statusCode: 401 });
				return;
			}
			if (!isAdmin(request)) {
				sendJson(response, 403, { key: 'auth.forbidden', statusCode: 403 });
				return;
			}

			// ROOT-only surfaces: accounts and affiliation claims.
			if (url.startsWith('/admin/accounts') || url.startsWith('/admin/claims')) {
				if (!isRoot(request)) {
					sendJson(response, 403, { key: 'auth.forbidden_root', statusCode: 403 });
					return;
				}

				const rootAccount = {
					id: 'acc-user',
					email: 'cliente@example.com',
					username: 'clienteuno',
					role: 'USER',
					accountType: 'INDIVIDUAL',
					status: 'ACTIVE',
					reputation: 3,
					createdAt: '2026-06-01T10:00:00.000Z',
					updatedAt: '2026-06-01T10:00:00.000Z'
				};

				if (url === '/admin/accounts' || url.startsWith('/admin/accounts?')) {
					if (request.method === 'POST') {
						void readJsonBody(request).then((body) => {
							const dto = (body ?? {}) as {
								email?: unknown;
								username?: unknown;
								accountType?: unknown;
								role?: unknown;
							};
							sendJson(response, 201, {
								id: 'acc-new',
								email: typeof dto.email === 'string' ? dto.email : 'nueva@example.com',
								username: typeof dto.username === 'string' ? dto.username : 'nuevacuenta',
								role: typeof dto.role === 'string' ? dto.role : 'USER',
								accountType: typeof dto.accountType === 'string' ? dto.accountType : 'INDIVIDUAL',
								status: 'ACTIVE',
								reputation: 0,
								createdAt: '2026-06-20T10:00:00.000Z',
								updatedAt: '2026-06-20T10:00:00.000Z'
							});
						});
						return;
					}
					const params = new URL(url, 'http://mock').searchParams;
					if (params.get('q') === 'empresa' || params.get('accountType') === 'BUSINESS') {
						sendJson(response, 200, {
							items: [
								{
									id: 'acc-biz',
									email: 'empresa@example.com',
									username: 'empresauno',
									role: 'USER',
									accountType: 'BUSINESS',
									status: 'ACTIVE',
									reputation: 0,
									createdAt: '2026-06-10T10:00:00.000Z',
									updatedAt: '2026-06-10T10:00:00.000Z'
								}
							],
							nextCursor: null
						});
						return;
					}
					sendJson(response, 200, { items: [rootAccount], nextCursor: null });
					return;
				}

				const accountPatch = url.match(/^\/admin\/accounts\/([^/?]+)$/);
				if (accountPatch && request.method === 'PATCH') {
					void readJsonBody(request).then((body) => {
						const dto = (body ?? {}) as Record<string, unknown>;
						sendJson(response, 200, {
							...rootAccount,
							id: accountPatch[1],
							...(typeof dto.email === 'string' ? { email: dto.email } : {}),
							...(typeof dto.username === 'string' ? { username: dto.username } : {}),
							...(typeof dto.role === 'string' ? { role: dto.role } : {}),
							...(typeof dto.accountType === 'string' ? { accountType: dto.accountType } : {}),
							...(typeof dto.status === 'string' ? { status: dto.status } : {})
						});
					});
					return;
				}

				const pendingClaim = {
					id: 'claim-pending',
					status: 'PENDING',
					note: null,
					createdAt: '2026-06-18T10:00:00.000Z',
					resolvedAt: null,
					user: { id: 'acc-biz', email: 'empresa@example.com', username: 'empresauno' },
					merchant: { id: 'merchant-acme', name: 'Acme Store' },
					reviewedBy: null
				};

				if (url === '/admin/claims' || url.startsWith('/admin/claims?')) {
					if (request.method === 'POST') {
						sendJson(response, 201, {
							...pendingClaim,
							id: 'claim-created',
							status: 'APPROVED',
							resolvedAt: '2026-06-20T10:00:00.000Z',
							reviewedBy: { id: 'e2e-root-id', username: 'e2eroot' }
						});
						return;
					}
					sendJson(response, 200, { items: [pendingClaim], nextCursor: null });
					return;
				}

				const claimAction = url.match(/^\/admin\/claims\/([^/?]+)\/(approve|reject)$/);
				if (claimAction && request.method === 'PATCH') {
					void readJsonBody(request).then((body) => {
						const dto = (body ?? {}) as { note?: unknown };
						sendJson(response, 200, {
							...pendingClaim,
							id: claimAction[1],
							status: claimAction[2] === 'approve' ? 'APPROVED' : 'REJECTED',
							note: typeof dto.note === 'string' ? dto.note : null,
							resolvedAt: '2026-06-21T10:00:00.000Z',
							reviewedBy: { id: 'e2e-root-id', username: 'e2eroot' }
						});
					});
					return;
				}

				sendJson(response, 404, { key: 'error.not_found', statusCode: 404 });
				return;
			}

			const adminOffer = {
				id: 'e2e-admin-offer',
				title: 'Oferta moderable',
				description: 'Oferta usada por el test admin.',
				offerType: 'discount',
				isOnline: false,
				externalUrl: 'https://example.com/promo',
				merchant: { id: 'merchant-test', name: 'TestStore', verified: false },
				location: {
					id: 'loc-test',
					address: 'Calle 1 #2-3',
					city: 'Bogotá',
					region: null,
					latitude: null,
					longitude: null,
					verified: false
				},
				startDate: '2026-05-01T00:00:00.000Z',
				endDate: '2026-12-31T00:00:00.000Z',
				status: 'ACTIVE',
				score: 4,
				reportCount: 2,
				commentCount: 3,
				createdAt: '2026-05-01T10:00:00.000Z',
				updatedAt: '2026-05-01T10:00:00.000Z',
				createdById: 'author-id',
				createdByUsername: 'autor-test',
				userVote: null,
				categories: []
			};

			if (url === '/admin/moderation/summary') {
				sendJson(response, 200, { pendingComments: 4, pendingOfferReports: 2 });
				return;
			}

			if (url === '/admin/merchants/merge' && request.method === 'POST') {
				sendJson(response, 200, {
					id: 'merchant-keep',
					name: 'Comercio destino',
					verified: true,
					blockedAt: null,
					createdAt: '2026-05-01T10:00:00.000Z'
				});
				return;
			}

			const merchantVerify = url.match(/^\/admin\/merchants\/([^/?]+)\/verify/);
			if (merchantVerify) {
				sendJson(response, 200, {
					id: merchantVerify[1],
					name: 'Comercio pendiente',
					verified: true,
					blockedAt: null,
					createdAt: '2026-06-01T10:00:00.000Z'
				});
				return;
			}

			const merchantBlock = url.match(/^\/admin\/merchants\/([^/?]+)\/block/);
			if (merchantBlock && request.method === 'POST') {
				sendJson(response, 200, {
					id: merchantBlock[1],
					name: 'Comercio pendiente',
					verified: false,
					blockedAt: '2026-06-12T10:00:00.000Z',
					createdAt: '2026-06-01T10:00:00.000Z'
				});
				return;
			}

			const merchantUnblock = url.match(/^\/admin\/merchants\/([^/?]+)\/unblock/);
			if (merchantUnblock && request.method === 'POST') {
				sendJson(response, 200, {
					id: merchantUnblock[1],
					name: 'Comercio bloqueado',
					verified: true,
					blockedAt: null,
					createdAt: '2026-05-01T10:00:00.000Z'
				});
				return;
			}

			const merchantEdit = url.match(/^\/admin\/merchants\/([^/?]+)$/);
			if (merchantEdit && request.method === 'PATCH') {
				void readJsonBody(request).then((body) => {
					const patch = (body ?? {}) as { name?: unknown };
					sendJson(response, 200, {
						id: merchantEdit[1],
						name: typeof patch.name === 'string' ? patch.name : 'Comercio pendiente',
						verified: false,
						blockedAt: null,
						createdAt: '2026-06-01T10:00:00.000Z'
					});
				});
				return;
			}

			const locationVerify = url.match(/^\/admin\/locations\/([^/?]+)\/verify/);
			if (locationVerify) {
				sendJson(response, 200, {
					id: locationVerify[1],
					merchantId: 'm-loc',
					address: 'Carrera 5 #10-20',
					city: 'Bogotá',
					region: null,
					latitude: null,
					longitude: null,
					verified: true,
					createdAt: '2026-06-01T10:00:00.000Z'
				});
				return;
			}

			const locationEdit = url.match(/^\/admin\/locations\/([^/?]+)$/);
			if (locationEdit && request.method === 'PATCH') {
				void readJsonBody(request).then((body) => {
					const patch = (body ?? {}) as { address?: unknown; city?: unknown; region?: unknown };
					sendJson(response, 200, {
						id: locationEdit[1],
						merchantId: 'm-loc',
						address: typeof patch.address === 'string' ? patch.address : 'Carrera 5 #10-20',
						city: typeof patch.city === 'string' ? patch.city : 'Bogotá',
						region: typeof patch.region === 'string' ? patch.region : null,
						latitude: 4.6,
						longitude: -74.08,
						verified: false,
						createdAt: '2026-06-01T10:00:00.000Z'
					});
				});
				return;
			}

			const locationDelete = url.match(/^\/admin\/locations\/([^/?]+)(\?|$)/);
			if (locationDelete && request.method === 'DELETE') {
				const reassign = new URL(url, 'http://mock').searchParams.get('reassignTo');
				// loc-in-use has attached offers: refuse unless a reassignment target is given.
				if (locationDelete[1] === 'loc-in-use' && !reassign) {
					sendJson(response, 409, { key: 'location.in_use', statusCode: 409 });
					return;
				}
				response.writeHead(204);
				response.end();
				return;
			}

			if (url === '/admin/merchants' || url.startsWith('/admin/merchants?')) {
				const params = new URL(url, 'http://mock').searchParams;
				let items;
				if (params.get('blocked') === 'true') {
					items = [
						{
							id: 'merchant-blocked',
							name: 'Comercio bloqueado',
							verified: true,
							blockedAt: '2026-06-10T10:00:00.000Z',
							createdAt: '2026-05-01T10:00:00.000Z'
						}
					];
				} else if (params.get('verified') === 'true') {
					items = [
						{
							id: 'merchant-verified',
							name: 'Comercio verificado',
							verified: true,
							blockedAt: null,
							createdAt: '2026-05-01T10:00:00.000Z'
						}
					];
				} else {
					items = [
						{
							id: 'merchant-pending',
							name: 'Comercio pendiente',
							verified: false,
							blockedAt: null,
							createdAt: '2026-06-01T10:00:00.000Z'
						}
					];
				}
				sendJson(response, 200, { items, nextCursor: null });
				return;
			}

			if (url === '/admin/locations' || url.startsWith('/admin/locations?')) {
				const params = new URL(url, 'http://mock').searchParams;
				// When scoped to a merchant, return its other address as a reassignment target.
				if (params.get('merchant')) {
					sendJson(response, 200, {
						items: [
							{
								id: 'loc-alt',
								merchantId: 'm-loc',
								address: 'Avenida 1 #2-3',
								city: 'Bogotá',
								region: 'Bogotá D.C.',
								latitude: 4.61,
								longitude: -74.07,
								verified: true,
								createdAt: '2026-06-01T10:00:00.000Z',
								merchant: { id: 'm-loc', name: 'Tienda asociada' }
							}
						],
						nextCursor: null
					});
					return;
				}
				sendJson(response, 200, {
					items: [
						{
							id: 'loc-pending',
							merchantId: 'm-loc',
							address: 'Carrera 5 #10-20',
							city: 'Bogotá',
							region: 'Bogotá D.C.',
							latitude: 4.6,
							longitude: -74.08,
							verified: false,
							createdAt: '2026-06-01T10:00:00.000Z',
							merchant: { id: 'm-loc', name: 'Tienda asociada' }
						}
					],
					nextCursor: null
				});
				return;
			}

			if (url === '/admin/offers' || url.startsWith('/admin/offers?')) {
				sendJson(response, 200, { items: [adminOffer], nextCursor: null, total: 1 });
				return;
			}

			if (/^\/admin\/offers\/[^/]+\/disable$/.test(url)) {
				sendJson(response, 200, { ...adminOffer, status: 'DISABLED' });
				return;
			}

			if (/^\/admin\/offers\/[^/]+\/restore$/.test(url)) {
				sendJson(response, 200, { ...adminOffer, status: 'ACTIVE', reportCount: 0 });
				return;
			}

			if (url === '/admin/reports' || url.startsWith('/admin/reports?')) {
				sendJson(response, 200, {
					items: [
						{
							id: 'report-1',
							reason: 'SCAM',
							comment: 'Parece una estafa',
							createdAt: '2026-05-20T10:00:00.000Z',
							user: { id: 'reporter-id', username: 'reportante' },
							offer: { id: 'e2e-admin-offer', title: 'Oferta moderable' }
						}
					],
					nextCursor: null
				});
				return;
			}

			if (/^\/admin\/offers\/[^/]+\/dismiss$/.test(url)) {
				sendJson(response, 200, { ...adminOffer, status: 'ACTIVE', reportCount: 0 });
				return;
			}

			const moderationComment = {
				id: 'mod-c1',
				content: 'Comentario reportado de prueba',
				reportCount: 3,
				hiddenAt: null,
				createdAt: '2026-05-20T10:00:00.000Z',
				user: { id: 'troll-id', username: 'troll' },
				offer: { id: 'e2e-admin-offer', title: 'Oferta moderable' }
			};

			const commentReportsAdminMatch = url.match(/^\/admin\/comments\/([^/?]+)\/reports(?:\?.*)?$/);
			if (commentReportsAdminMatch) {
				sendJson(response, 200, {
					items: [
						{
							id: 'rd-1',
							reason: 'SPAM',
							note: 'publicidad evidente',
							status: 'PENDING',
							createdAt: '2026-05-20T10:00:00.000Z',
							user: { id: 'r1', username: 'denunciante' }
						}
					],
					nextCursor: null
				});
				return;
			}

			if (/^\/admin\/comments\/[^/]+\/hide$/.test(url)) {
				sendJson(response, 200, { ...moderationComment, hiddenAt: '2026-05-21T10:00:00.000Z' });
				return;
			}

			if (/^\/admin\/comments\/[^/]+\/dismiss$/.test(url)) {
				sendJson(response, 200, { ...moderationComment, reportCount: 0 });
				return;
			}

			if (url === '/admin/comments' || url.startsWith('/admin/comments?')) {
				sendJson(response, 200, { items: [moderationComment], nextCursor: null });
				return;
			}

			if (/^\/admin\/users\/[^/]+\/(disable|restore)$/.test(url)) {
				const disabling = url.endsWith('/disable');
				sendJson(response, 200, {
					id: 'author-id',
					username: 'autor-test',
					role: 'USER',
					status: disabling ? 'DISABLED' : 'ACTIVE',
					createdAt: '2026-05-01T10:00:00.000Z',
					updatedAt: '2026-05-01T10:00:00.000Z'
				});
				return;
			}
		}

		sendJson(response, 404, {
			key: 'error.not_found',
			statusCode: 404
		});
	});

	await new Promise<void>((resolve) => {
		mockBackend.listen(4174, '127.0.0.1', () => resolve());
	});
});

test.afterAll(async () => {
	await new Promise<void>((resolve, reject) => {
		mockBackend.close((error) => (error ? reject(error) : resolve()));
	});
});

test('home page renders the hero and section titles', async ({ page }) => {
	await page.goto('/');

	await expect(
		page.getByRole('heading', { name: 'Descubre las mejores ofertas en Colombia' })
	).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Ofertas calientes' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Agregadas recientemente' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible();
	await expect(page.getByRole('link', { name: 'Crear cuenta' }).first()).toBeVisible();
});

test('login page renders the login form', async ({ page }) => {
	await page.goto('/login');

	await expect(page.getByRole('heading', { name: 'Inicia sesión' }).first()).toBeVisible();
	await expect(page.getByLabel('Correo electrónico')).toBeVisible();
	await expect(page.getByLabel('Contraseña')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
});

test('register page renders the register form', async ({ page }) => {
	await page.goto('/register');

	await expect(page.getByRole('heading', { name: 'Crear cuenta' }).first()).toBeVisible();
	await expect(page.getByLabel('Correo electrónico')).toBeVisible();
	await expect(page.getByLabel('Nombre de usuario')).toBeVisible();
	await expect(page.getByLabel('Contraseña', { exact: true })).toBeVisible();
	await expect(page.getByLabel('Confirmar contraseña')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Registrarme' })).toBeVisible();
});

test('deals page renders the listing heading and filters', async ({ page }) => {
	await page.goto('/deals');

	await expect(page.getByRole('heading', { name: 'Todas las ofertas' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Más recientes' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Más populares' })).toBeVisible();
});

test('detail page renders a fallback when the offer cannot be loaded', async ({ page }) => {
	await page.goto('/deals/non-existent-id');

	await expect(page.getByRole('link', { name: 'Volver al inicio' })).toBeVisible();
});

test('profile redirects unauthenticated users to login', async ({ page }) => {
	await page.goto('/profile');

	await expect(page).toHaveURL(/\/login$/);
	await expect(page.getByRole('heading', { name: 'Inicia sesión' }).first()).toBeVisible();
});

test('profile offers tab renders an empty state for authenticated users without offers', async ({
	page,
	context
}) => {
	await context.addCookies([
		{
			name: 'e2e_session',
			value: 'authenticated',
			url: 'http://127.0.0.1:4173'
		}
	]);

	await page.goto('/profile');

	const main = page.locator('main');
	await expect(page).toHaveURL(/\/profile$/);
	await expect(main.getByRole('heading', { name: 'e2euser' })).toBeVisible();

	// Stats come from GET /users/me/stats; reputation from GET /users/me.
	await expect(main.getByText('3', { exact: true })).toBeVisible();
	await expect(main.getByText('7', { exact: true })).toBeVisible();
	await expect(main.getByText('Reputación')).toBeVisible();
	await expect(main.getByText('12', { exact: true })).toBeVisible();

	await expect(main.getByText('Mis ofertas')).toBeVisible();
	await expect(main.getByText('Aún no has publicado ofertas.')).toBeVisible();
	await expect(main.getByText('Publica tu primera oferta para que aparezca aquí.')).toBeVisible();
	await expect(main.getByRole('link', { name: 'Publicar oferta' })).toBeVisible();
});

test('profile comments and votes tabs list the user activity', async ({ page, context }) => {
	await context.addCookies([
		{ name: 'e2e_session', value: 'authenticated', url: 'http://127.0.0.1:4173' }
	]);

	await page.goto('/profile');
	const main = page.locator('main');
	await expect(main.getByRole('heading', { name: 'e2euser' })).toBeVisible();

	// Comments tab lazy-loads GET /users/me/comments.
	await main.getByText('Mis comentarios').click();
	await expect(main.getByText('Oferta comentada')).toBeVisible();
	await expect(main.getByText('Mi comentario de prueba')).toBeVisible();

	// Votes tab lazy-loads GET /users/me/votes and shows the offer score.
	await main.getByText('Mis votos').click();
	await expect(main.getByText('Oferta votada')).toBeVisible();
	await expect(main.getByText('16°')).toBeVisible();
});

test('profile lets the user edit their username', async ({ page, context }) => {
	await context.addCookies([
		{ name: 'e2e_session', value: 'authenticated', url: 'http://127.0.0.1:4173' }
	]);

	await page.goto('/profile');
	const main = page.locator('main');
	await expect(main.getByRole('heading', { name: 'e2euser' })).toBeVisible();

	await main.getByRole('button', { name: 'Editar perfil' }).click();
	await page.getByLabel('Nombre de usuario').fill('nicolas2');
	await page.getByRole('button', { name: 'Guardar cambios' }).click();

	// PATCH /users/me echoes the new username; the store update refreshes the header.
	await expect(main.getByRole('heading', { name: 'nicolas2' })).toBeVisible();
});

test('create deal redirects unauthenticated users to login', async ({ page }) => {
	await page.goto('/create-deal');

	await expect(page).toHaveURL(/\/login$/);
	await expect(page.getByRole('heading', { name: 'Inicia sesión' }).first()).toBeVisible();
});

test('create deal shows a required category picker for an authenticated user', async ({
	page,
	context
}) => {
	await context.addCookies([
		{ name: 'e2e_session', value: 'authenticated', url: 'http://127.0.0.1:4173' }
	]);

	await page.goto('/create-deal');

	// Categories render right away (the form is no longer gated behind the type).
	const techChip = page.getByText('Tecnología', { exact: true });
	await expect(techChip).toBeVisible();
	await expect(page.getByText('Otros', { exact: true })).toBeVisible();

	// Selecting a chip toggles the hidden checkbox bound to categoryIds.
	await techChip.click();
	await expect(page.locator('input[name="categoryIds"][value="cat-technology"]')).toBeChecked();

	// Merchant autocomplete: typing surfaces existing merchants from GET /merchants.
	await page.fill('input#merchantName', 'acme');
	await expect(page.getByRole('option', { name: /Acme Store/ })).toBeVisible();

	// The address field is revealed only once a city is entered.
	await expect(page.locator('input#locationAddress')).toHaveCount(0);
	await page.fill('input#locationCity', 'Bogotá');
	await expect(page.locator('input#locationAddress')).toBeVisible();

	// Toggling the deal to "online" drops the city and address fields entirely.
	await page.getByText('Oferta en línea', { exact: true }).click();
	await expect(page.locator('input#locationCity')).toHaveCount(0);
	await expect(page.locator('input#locationAddress')).toHaveCount(0);
});

test('create deal links a merchant and geocodes the address', async ({ page, context }) => {
	await context.addCookies([
		{ name: 'e2e_session', value: 'authenticated', url: 'http://127.0.0.1:4173' }
	]);

	await page.goto('/create-deal');
	await page.getByText('Tecnología', { exact: true }).waitFor();

	// Pick an existing merchant from the referential (GET /merchants).
	await page.fill('input#merchantName', 'Acme');
	await page.getByRole('option', { name: /Acme Store/ }).click();
	await expect(page.locator('input#merchantName')).toHaveValue('Acme Store');

	// The city is chosen from the bundled list (constrained, no free text).
	await page.fill('input#locationCity', 'mede');
	await page.getByRole('option', { name: /Medellín/ }).click();
	await expect(page.locator('input#locationCity')).toHaveValue('Medellín');

	// The address then geocodes (GET /geocode). Picking a suggestion keeps the
	// exact typed address and leaves the chosen city untouched.
	await page.fill('input#locationAddress', 'Calle 10');
	const suggestion = page.getByRole('option', { name: /Calle 10/ });
	await expect(suggestion).toBeVisible();
	await suggestion.click();
	await expect(page.locator('input#locationAddress')).toHaveValue('Calle 10');
	await expect(page.locator('input#locationCity')).toHaveValue('Medellín');
});

test('create deal surfaces the missing-category error on submit', async ({ page, context }) => {
	await context.addCookies([
		{ name: 'e2e_session', value: 'authenticated', url: 'http://127.0.0.1:4173' }
	]);

	await page.goto('/create-deal');
	await page.getByText('Tecnología', { exact: true }).waitFor();

	// Fill every required field except the category, then submit.
	await page.selectOption('select#offerType', 'discount');
	await page.fill('input#title', 'Gran descuento de prueba');
	await page.fill('textarea#description', 'Una descripción de prueba suficientemente larga.');
	await page.fill('input#merchantName', 'Acme Store');
	await page.fill('input#locationCity', 'Bogotá');
	await page.fill('input#locationAddress', 'Calle 10 #20-30');

	await page.getByRole('button', { name: 'Publicar oferta' }).click();

	// The array-level categoryIds error must surface under the category picker.
	await expect(page.getByText('Selecciona al menos una categoría.')).toBeVisible();
});

test('create deal publishes a local offer end to end', async ({ page, context }) => {
	await context.addCookies([
		{ name: 'e2e_session', value: 'authenticated', url: 'http://127.0.0.1:4173' }
	]);

	await page.goto('/create-deal');
	await page.getByText('Tecnología', { exact: true }).waitFor();

	await page.selectOption('select#offerType', 'discount');
	await page.fill('input#title', 'Gran descuento de prueba');
	await page.fill('textarea#description', 'Una descripción de prueba suficientemente larga.');
	await page.getByText('Tecnología', { exact: true }).click();

	// Pick the merchant from the referential.
	await page.fill('input#merchantName', 'Acme');
	await page.getByRole('option', { name: /Acme Store/ }).click();

	// City reveals the address; pick a geocoded suggestion to anchor the location.
	await page.fill('input#locationCity', 'Bogotá');
	await page.fill('input#locationAddress', 'Calle 10');
	await page.getByRole('option', { name: /Calle 10/ }).click();

	await page.getByRole('button', { name: 'Publicar oferta' }).click();

	// The action POSTs the offer and redirects to its detail page.
	await expect(page).toHaveURL(/\/deals\/new-offer$/);
});

test('business account sees its space with the affiliation banner and stats', async ({
	page,
	context
}) => {
	await context.addCookies([
		{ name: 'e2e_session', value: 'business', url: 'http://127.0.0.1:4173' }
	]);

	await page.goto('/business');

	// Affiliation banner + the six stat cards.
	await expect(page.getByText('Comercio afiliado')).toBeVisible();
	await expect(page.getByText('MarcaOficial').first()).toBeVisible();
	await expect(page.getByText('120')).toBeVisible();
	await expect(page.getByText('Vistas')).toBeVisible();
	await expect(page.getByText('Clics')).toBeVisible();
	await expect(page.getByText('Ofertas activas (de 4)')).toBeVisible();

	// Each stat exposes an explanatory tooltip.
	await page.locator('#stat-info-views').hover();
	await expect(page.getByText(/Tus propias visitas no cuentan/)).toBeVisible();

	// Both own offers render, then the address filter narrows to the local one.
	await expect(page.getByText('Oferta online oficial')).toBeVisible();
	await expect(page.getByText('Oferta local oficial')).toBeVisible();
	await page.getByRole('button', { name: /Carrera 7 #45-10/ }).click();
	await expect(page.getByText('Oferta online oficial')).toBeHidden();
	await expect(page.getByText('Oferta local oficial')).toBeVisible();

	// The online chip flips the selection.
	await page.getByRole('button', { name: 'En línea' }).click();
	await expect(page.getByText('Oferta online oficial')).toBeVisible();
	await expect(page.getByText('Oferta local oficial')).toBeHidden();
});

test('business account with a pending affiliation sees the waiting banner', async ({
	page,
	context
}) => {
	await context.addCookies([
		{ name: 'e2e_session', value: 'bizpending', url: 'http://127.0.0.1:4173' }
	]);

	await page.goto('/business');

	await expect(page.getByText('Afiliación en curso')).toBeVisible();
	// No stats or actions while waiting.
	await expect(page.getByText('Publicar oferta oficial')).toBeHidden();
});

test('business publishes an official offer with the imposed merchant', async ({
	page,
	context
}) => {
	await context.addCookies([
		{ name: 'e2e_session', value: 'business', url: 'http://127.0.0.1:4173' }
	]);

	await page.goto('/business/new-offer');
	await page.getByText('Tecnología', { exact: true }).waitFor();

	// The affiliated merchant is imposed: read-only field, no combobox.
	const merchantInput = page.locator('input#merchantName');
	await expect(merchantInput).toBeDisabled();
	await expect(merchantInput).toHaveValue('MarcaOficial');

	await page.selectOption('select#offerType', 'discount');
	await page.fill('input#title', 'Oferta oficial de prueba');
	await page.fill('textarea#description', 'Una descripción oficial suficientemente larga.');
	await page.getByText('Tecnología', { exact: true }).click();

	// Online offer: external link instead of a location.
	await page.getByText('Oferta en línea').click();
	await page.fill('input#externalUrl', 'https://example.com/oficial');

	// The action POSTs to /business/offers server-side (the mock only answers
	// 201 on that business endpoint) and redirects to the detail page.
	await page.getByRole('button', { name: 'Publicar oferta' }).click();
	await expect(page).toHaveURL(/\/deals\/new-offer$/);
});

test('business requests a new address for its merchant', async ({ page, context }) => {
	await context.addCookies([
		{ name: 'e2e_session', value: 'business', url: 'http://127.0.0.1:4173' }
	]);

	await page.goto('/business');
	await page.getByRole('button', { name: 'Solicitar dirección' }).click();

	const dialog = page.getByRole('dialog');
	await dialog.locator('input#bizLocationCity').fill('Bogotá');
	await dialog.locator('input#bizLocationAddress').fill('Calle 10');
	await page.getByRole('option', { name: /Calle 10/ }).click();

	const locationRequest = page.waitForRequest(
		(request) => request.url().includes('/api/business/locations') && request.method() === 'POST'
	);
	await dialog.getByRole('button', { name: 'Enviar solicitud' }).click();
	await locationRequest;

	await expect(page.getByText('Dirección enviada; queda en espera de validación.')).toBeVisible();
});

test('an individual account gets a 403 on the business space', async ({ page, context }) => {
	await context.addCookies([
		{ name: 'e2e_session', value: 'authenticated', url: 'http://127.0.0.1:4173' }
	]);

	const response = await page.goto('/business');
	expect(response?.status()).toBe(403);
});

test('edit deal redirects unauthenticated users to login', async ({ page }) => {
	await page.goto('/deals/non-existent-id/edit');

	await expect(page).toHaveURL(/\/login$/);
	await expect(page.getByRole('heading', { name: 'Inicia sesión' }).first()).toBeVisible();
});

test('offer detail lets an authenticated user toggle their up-vote', async ({ page, context }) => {
	await context.addCookies([
		{
			name: 'e2e_session',
			value: 'authenticated',
			url: 'http://127.0.0.1:4173'
		}
	]);

	await page.goto('/deals/e2e-vote-offer');

	const upButton = page.getByRole('button', { name: 'Votar positivo' });
	await expect(upButton).toBeVisible();
	await expect(page.getByText('15°')).toBeVisible();

	await upButton.click();
	await expect(page.getByText('16°')).toBeVisible();
	await expect(upButton).toHaveAttribute('aria-pressed', 'true');

	await upButton.click();
	await expect(page.getByText('15°')).toBeVisible();
	await expect(upButton).toHaveAttribute('aria-pressed', 'false');
});

test('offer detail shows the official badge and tracks the view and the click', async ({
	page
}) => {
	// The view hit must fire once when the detail loads.
	const viewRequest = page.waitForRequest(
		(request) =>
			request.url().includes('/api/offers/e2e-official-offer/view') && request.method() === 'POST'
	);

	await page.goto('/deals/e2e-official-offer');

	await expect(page.getByRole('heading', { name: 'Oferta oficial de la marca' })).toBeVisible();
	await expect(page.getByText('Oficial', { exact: true })).toBeVisible();
	await viewRequest;

	// The click hit fires when following the merchant link.
	const clickRequest = page.waitForRequest(
		(request) =>
			request.url().includes('/api/offers/e2e-official-offer/click') && request.method() === 'POST'
	);
	await page.getByRole('link', { name: /Ir a la tienda/ }).click();
	await clickRequest;
});

test('offer detail shows an auth error when an anonymous visitor tries to vote', async ({
	page
}) => {
	await page.goto('/deals/e2e-vote-offer');

	const upButton = page.getByRole('button', { name: 'Votar positivo' });
	await expect(upButton).toBeVisible();

	await upButton.click();
	await expect(page.getByRole('alert')).toContainText('Tu sesión ha expirado');
	await expect(page.getByText('15°')).toBeVisible();
});

test('offer detail lets an authenticated user submit a report', async ({ page, context }) => {
	await context.addCookies([
		{
			name: 'e2e_session',
			value: 'authenticated',
			url: 'http://127.0.0.1:4173'
		}
	]);

	await page.goto('/deals/e2e-report-offer');

	const reportButton = page.getByRole('button', { name: 'Reportar' });
	await expect(reportButton).toBeVisible();

	await reportButton.click();
	await expect(page.getByRole('heading', { name: 'Reportar oferta' })).toBeVisible();

	await page.getByLabel('Motivo *').selectOption('SCAM');
	await page.getByRole('button', { name: 'Enviar reporte' }).click();

	await expect(page.getByRole('heading', { name: 'Reportar oferta' })).toBeHidden();
	await expect(page.getByText('Esta oferta está siendo revisada por la moderación.')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Ya reportada' })).toBeDisabled();
});

test('offer detail hides the report button for anonymous visitors', async ({ page }) => {
	await page.goto('/deals/e2e-report-offer');

	await expect(page.getByRole('button', { name: 'Compartir' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Reportar' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Ya reportada' })).toHaveCount(0);
});

test('admin panel redirects anonymous visitors to login', async ({ page }) => {
	await page.goto('/admin');

	await expect(page).toHaveURL(/\/login$/);
});

test('admin panel returns 403 for authenticated non-admins', async ({ page, context }) => {
	await context.addCookies([
		{ name: 'e2e_session', value: 'authenticated', url: 'http://127.0.0.1:4173' }
	]);

	const response = await page.goto('/admin');

	expect(response?.status()).toBe(403);
});

test('admin offers tab lists offers and disables one for an admin', async ({ page, context }) => {
	await context.addCookies([{ name: 'e2e_session', value: 'admin', url: 'http://127.0.0.1:4173' }]);

	await page.goto('/admin/offers');

	await expect(page.getByRole('link', { name: 'Oferta moderable' })).toBeVisible();

	await page.getByRole('button', { name: 'Desactivar', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Restaurar' })).toBeVisible();
});

test('admin merchants tab lists pending items and verifies a merchant', async ({
	page,
	context
}) => {
	await context.addCookies([{ name: 'e2e_session', value: 'admin', url: 'http://127.0.0.1:4173' }]);

	await page.goto('/admin/merchants');

	// Both queues render their pending items.
	const merchantRow = page.getByRole('row', { name: /Comercio pendiente/ });
	await expect(merchantRow).toBeVisible();
	const locationRow = page.getByRole('row', { name: /Carrera 5 #10-20/ });
	await expect(locationRow).toBeVisible();

	// A pending address with coordinates can expand an inline map.
	await expect(page.locator('.leaflet-container')).toHaveCount(0);
	await locationRow.getByRole('button', { name: 'Ver mapa' }).click();
	await expect(page.locator('.leaflet-container')).toHaveCount(1);

	// Verifying the merchant removes it from the queue.
	await merchantRow.getByRole('button', { name: 'Verificar' }).click();
	await expect(page.getByText('Comercio pendiente')).toBeHidden();
});

test('admin filters merchants and blocks then unblocks one', async ({ page, context }) => {
	await context.addCookies([{ name: 'e2e_session', value: 'admin', url: 'http://127.0.0.1:4173' }]);

	await page.goto('/admin/merchants');

	const merchantRow = page.getByRole('row', { name: /Comercio pendiente/ });
	await expect(merchantRow).toBeVisible();

	// Blocking the pending merchant keeps it in place but flags it as blocked.
	await merchantRow.getByRole('button', { name: 'Bloquear' }).click();
	await expect(merchantRow.getByText('Bloqueado')).toBeVisible();
	await expect(merchantRow.getByRole('button', { name: 'Desbloquear' })).toBeVisible();

	// The "blocked" filter loads only blocked merchants.
	await page.getByRole('button', { name: 'Bloqueados' }).click();
	const blockedRow = page.getByRole('row', { name: /Comercio bloqueado/ });
	await expect(blockedRow).toBeVisible();

	// Unblocking from the blocked filter drops it from the queue.
	await blockedRow.getByRole('button', { name: 'Desbloquear' }).click();
	await expect(page.getByText('Comercio bloqueado')).toBeHidden();
});

test('admin renames a merchant from the edit dialog', async ({ page, context }) => {
	await context.addCookies([{ name: 'e2e_session', value: 'admin', url: 'http://127.0.0.1:4173' }]);

	await page.goto('/admin/merchants');

	const merchantRow = page.getByRole('row', { name: /Comercio pendiente/ });
	await merchantRow.getByRole('button', { name: 'Editar' }).click();

	const dialog = page.getByRole('dialog');
	await dialog.getByRole('textbox').fill('Comercio renombrado');
	await dialog.getByRole('button', { name: 'Guardar' }).click();

	await expect(page.getByText('Comercio renombrado')).toBeVisible();
	await expect(page.getByText('Comercio pendiente')).toBeHidden();
});

test('admin edits then deletes a pending address', async ({ page, context }) => {
	await context.addCookies([{ name: 'e2e_session', value: 'admin', url: 'http://127.0.0.1:4173' }]);

	await page.goto('/admin/merchants');

	const locationRow = page.getByRole('row', { name: /Carrera 5 #10-20/ });
	await expect(locationRow).toBeVisible();

	// Editing the address writes the new value back into the table.
	await locationRow.getByRole('button', { name: 'Editar' }).click();
	const editDialog = page.getByRole('dialog');
	await editDialog.getByLabel('Dirección').fill('Calle Nueva 99');
	await editDialog.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByText('Calle Nueva 99')).toBeVisible();

	// Deleting the address (no attached offers) removes its row.
	const updatedRow = page.getByRole('row', { name: /Calle Nueva 99/ });
	await updatedRow.getByRole('button', { name: 'Eliminar' }).click();
	const deleteDialog = page.getByRole('dialog');
	await deleteDialog.getByRole('button', { name: 'Eliminar' }).click();
	await expect(page.getByRole('row', { name: /Calle Nueva 99/ })).toBeHidden();
});

test("admin views and edits a merchant's addresses from its panel", async ({ page, context }) => {
	await context.addCookies([{ name: 'e2e_session', value: 'admin', url: 'http://127.0.0.1:4173' }]);

	await page.goto('/admin/merchants');

	const merchantRow = page.getByRole('row', { name: /Comercio pendiente/ });
	await merchantRow.getByRole('button', { name: 'Direcciones' }).click();

	// All the merchant's addresses (verified + pending) load in the expanded panel.
	await expect(page.getByText('Avenida 1 #2-3')).toBeVisible();

	// Editing an address from the panel updates it in place. The merchant row keeps
	// its own "Editar" button (index 0); the panel address edit is the next one.
	await page.getByRole('button', { name: 'Editar' }).nth(1).click();
	const dialog = page.getByRole('dialog');
	await dialog.getByLabel('Dirección').fill('Avenida Reformada 5');
	await dialog.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByText('Avenida Reformada 5')).toBeVisible();

	// Collapsing the panel hides the addresses again.
	await merchantRow.getByRole('button', { name: 'Ocultar direcciones' }).click();
	await expect(page.getByText('Avenida Reformada 5')).toBeHidden();
});

test('root sees the accounts tab, lists accounts and creates one', async ({ page, context }) => {
	await context.addCookies([{ name: 'e2e_session', value: 'root', url: 'http://127.0.0.1:4173' }]);

	await page.goto('/admin/accounts');

	// The ROOT-only tabs are in the sidebar and the listing renders.
	await expect(page.getByRole('link', { name: 'Cuentas' }).first()).toBeVisible();
	await expect(page.getByRole('link', { name: 'Afiliaciones' }).first()).toBeVisible();
	const accountRow = page.getByRole('row', { name: /clienteuno/ });
	await expect(accountRow).toBeVisible();

	// Creating an account posts the payload and closes the dialog.
	await page.getByRole('button', { name: 'Crear cuenta' }).click();
	const dialog = page.getByRole('dialog');
	await dialog.getByLabel('Correo electrónico').fill('nueva@example.com');
	await dialog.getByLabel('Nombre de usuario').fill('nuevacuenta');
	await dialog.getByLabel('Contraseña provisional').fill('provisional1');
	const createRequest = page.waitForRequest(
		(request) => request.url().includes('/api/admin/accounts') && request.method() === 'POST'
	);
	await dialog.getByRole('button', { name: 'Crear cuenta' }).click();
	await createRequest;
	await expect(dialog).toBeHidden();
});

test('root disables an account from the listing', async ({ page, context }) => {
	await context.addCookies([{ name: 'e2e_session', value: 'root', url: 'http://127.0.0.1:4173' }]);

	await page.goto('/admin/accounts');

	const accountRow = page.getByRole('row', { name: /clienteuno/ });
	await accountRow.getByRole('button', { name: 'Desactivar' }).click();

	// The PATCH flips the status and the row shows the disabled chip.
	await expect(accountRow.getByText('Desactivada')).toBeVisible();
	await expect(accountRow.getByRole('button', { name: 'Restaurar' })).toBeVisible();
});

test('root approves a pending affiliation claim', async ({ page, context }) => {
	await context.addCookies([{ name: 'e2e_session', value: 'root', url: 'http://127.0.0.1:4173' }]);

	await page.goto('/admin/claims');

	const claimRow = page.getByRole('row', { name: /empresauno/ });
	await expect(claimRow).toBeVisible();
	await expect(claimRow.getByText('Acme Store')).toBeVisible();

	// Approving drops the claim from the pending queue.
	await claimRow.getByRole('button', { name: 'Aprobar' }).click();
	await expect(page.getByText('empresauno')).toBeHidden();
});

test('root rejects a claim with a note', async ({ page, context }) => {
	await context.addCookies([{ name: 'e2e_session', value: 'root', url: 'http://127.0.0.1:4173' }]);

	await page.goto('/admin/claims');

	const claimRow = page.getByRole('row', { name: /empresauno/ });
	await claimRow.getByRole('button', { name: 'Rechazar' }).click();

	const dialog = page.getByRole('dialog');
	await dialog.getByLabel('Motivo (opcional)').fill('No pudo demostrar la propiedad.');
	await dialog.getByRole('button', { name: 'Rechazar' }).click();

	await expect(page.getByRole('row', { name: /empresauno/ })).toBeHidden();
});

test('a plain admin neither sees the root tabs nor opens the root pages', async ({
	page,
	context
}) => {
	await context.addCookies([{ name: 'e2e_session', value: 'admin', url: 'http://127.0.0.1:4173' }]);

	await page.goto('/admin');
	await expect(page.getByRole('link', { name: 'Ofertas' }).first()).toBeVisible();
	await expect(page.getByRole('link', { name: 'Cuentas' })).toHaveCount(0);
	await expect(page.getByRole('link', { name: 'Afiliaciones' })).toHaveCount(0);

	const response = await page.goto('/admin/accounts');
	expect(response?.status()).toBe(403);
});

test('admin reports tab lists pending reports for an admin', async ({ page, context }) => {
	await context.addCookies([{ name: 'e2e_session', value: 'admin', url: 'http://127.0.0.1:4173' }]);

	await page.goto('/admin/reports');

	await expect(page.getByRole('link', { name: 'Oferta moderable' })).toBeVisible();
	await expect(page.getByText('Parece una estafa')).toBeVisible();
	await expect(page.getByText('reportante')).toBeVisible();
});

test('admin reports tab dismisses an offer report', async ({ page, context }) => {
	await context.addCookies([{ name: 'e2e_session', value: 'admin', url: 'http://127.0.0.1:4173' }]);

	await page.goto('/admin/reports');
	await expect(page.getByText('Parece una estafa')).toBeVisible();

	await page.getByRole('button', { name: 'Descartar' }).click();

	await expect(page.getByText('No hay reportes pendientes.')).toBeVisible();
});

test('admin comments tab shows the queue, report details, and hides a comment', async ({
	page,
	context
}) => {
	await context.addCookies([{ name: 'e2e_session', value: 'admin', url: 'http://127.0.0.1:4173' }]);

	await page.goto('/admin/comments');

	await expect(page.getByText('Comentario reportado de prueba')).toBeVisible();
	await expect(page.getByText('troll')).toBeVisible();

	await page.getByRole('button', { name: 'Ver reportes' }).click();
	await expect(page.getByText('publicidad evidente')).toBeVisible();

	await page.getByRole('button', { name: 'Ocultar', exact: true }).click();
	await expect(page.getByText('No hay comentarios en la cola de moderación.')).toBeVisible();
});

test('admin dashboard shows moderation summary cards and nav badges', async ({ page, context }) => {
	await context.addCookies([{ name: 'e2e_session', value: 'admin', url: 'http://127.0.0.1:4173' }]);

	await page.goto('/admin');

	await expect(page.getByText('Comentarios por revisar')).toBeVisible();
	await expect(page.getByText('Ofertas reportadas')).toBeVisible();
	await expect(page.getByText('Total pendiente')).toBeVisible();

	// Sidebar badges: pendingComments (4) on Comentarios, pendingOfferReports (2) on Reportes.
	const sidebar = page.getByRole('navigation', { name: 'Moderación' });
	await expect(sidebar.getByText('4')).toBeVisible();
	await expect(sidebar.getByText('2')).toBeVisible();
});

test('offer detail marks a past-date offer as expired and locks vote/report', async ({
	page,
	context
}) => {
	await context.addCookies([
		{ name: 'e2e_session', value: 'authenticated', url: 'http://127.0.0.1:4173' }
	]);

	await page.goto('/deals/e2e-expired-offer');

	await expect(page.getByRole('heading', { name: 'Oferta caducada de prueba' })).toBeVisible();
	await expect(page.getByText('Esta oferta ya expiró.')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Votar positivo' })).toBeDisabled();
	await expect(page.getByRole('button', { name: 'Votar negativo' })).toBeDisabled();
	await expect(
		page.getByRole('button', { name: 'No puedes reportar una oferta expirada' })
	).toBeDisabled();
});

test('offer detail shows the comment thread with a tombstone and redirects anonymous posters', async ({
	page
}) => {
	await page.goto('/deals/e2e-comment-offer');

	await expect(page.getByText('Primer comentario de prueba')).toBeVisible();
	await expect(page.getByText('[eliminado por el autor]')).toBeVisible();

	await page.getByPlaceholder('Escribe un comentario...').fill('Hola comunidad');
	await page.getByRole('button', { name: 'Comentar' }).click();

	await expect(page).toHaveURL(/\/login$/);
});

test('authenticated user can post a comment on the thread', async ({ page, context }) => {
	await context.addCookies([
		{ name: 'e2e_session', value: 'authenticated', url: 'http://127.0.0.1:4173' }
	]);

	await page.goto('/deals/e2e-comment-offer');

	await page.getByPlaceholder('Escribe un comentario...').fill('Mi nuevo comentario');
	await page.getByRole('button', { name: 'Comentar' }).click();

	await expect(page.getByText('Mi nuevo comentario')).toBeVisible();
});

test('authenticated user can up-vote and remove the vote on a comment', async ({
	page,
	context
}) => {
	await context.addCookies([
		{ name: 'e2e_session', value: 'authenticated', url: 'http://127.0.0.1:4173' }
	]);

	await page.goto('/deals/e2e-comment-offer');

	const commentItem = page.locator('div.grow').filter({ hasText: 'Primer comentario de prueba' });
	const upButton = commentItem.getByRole('button', { name: 'Votar positivo' });

	await upButton.click();
	await expect(upButton).toHaveAttribute('aria-pressed', 'true');

	await upButton.click();
	await expect(upButton).toHaveAttribute('aria-pressed', 'false');
});

test('anonymous comment vote redirects to login', async ({ page }) => {
	await page.goto('/deals/e2e-comment-offer');

	const commentItem = page.locator('div.grow').filter({ hasText: 'Primer comentario de prueba' });
	await commentItem.getByRole('button', { name: 'Votar positivo' }).click();
	await expect(page).toHaveURL(/\/login$/);
});

test('offer detail shows a moderator-hidden comment placeholder', async ({ page }) => {
	await page.goto('/deals/e2e-comment-offer');

	await expect(page.getByText('[ocultado por un moderador]')).toBeVisible();
});

test('authenticated user can report a comment', async ({ page, context }) => {
	await context.addCookies([
		{ name: 'e2e_session', value: 'authenticated', url: 'http://127.0.0.1:4173' }
	]);

	await page.goto('/deals/e2e-comment-offer');

	const commentItem = page.locator('div.grow').filter({ hasText: 'Primer comentario de prueba' });
	await commentItem.getByRole('button', { name: 'Reportar' }).click();

	await expect(page.getByRole('heading', { name: 'Reportar comentario' })).toBeVisible();
	await page.getByLabel('Motivo *').selectOption('SPAM');
	await page.getByRole('button', { name: 'Enviar reporte' }).click();

	await expect(page.getByRole('heading', { name: 'Reportar comentario' })).toBeHidden();
	await expect(commentItem.getByText('Reportado')).toBeVisible();
});

test('never persists an auth token in localStorage (cookie-only session)', async ({ page }) => {
	await page.goto('/');

	const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
	expect(localStorageKeys).not.toContain('ofertando.accessToken');
	expect(localStorageKeys.filter((key) => key.toLowerCase().includes('token'))).toEqual([]);
});

// --- Accessibility (axe-core) -------------------------------------------
// RGAA/WCAG 2.1 AA automated pass: every key screen must be free of
// critical and serious axe violations. This complements (not replaces) the
// manual audit — axe only covers the machine-checkable criteria.

const A11Y_SCREENS: Array<{
	name: string;
	path: string;
	session?: string;
	ready: (page: import('@playwright/test').Page) => Promise<void>;
}> = [
	{
		name: 'home',
		path: '/',
		ready: async (page) => {
			await page.getByRole('heading', { level: 1 }).first().waitFor();
		}
	},
	{
		name: 'deals list',
		path: '/deals',
		ready: async (page) => {
			await page.getByRole('heading', { level: 1 }).first().waitFor();
		}
	},
	{
		name: 'offer detail',
		path: '/deals/e2e-official-offer',
		ready: async (page) => {
			await page.getByRole('heading', { name: 'Oferta oficial de la marca' }).waitFor();
		}
	},
	{
		name: 'login',
		path: '/login',
		ready: async (page) => {
			await page.getByRole('heading', { name: 'Inicia sesión' }).first().waitFor();
		}
	},
	{
		name: 'register',
		path: '/register',
		ready: async (page) => {
			await page.getByRole('heading', { level: 1 }).first().waitFor();
		}
	},
	{
		name: 'create deal',
		path: '/create-deal',
		session: 'authenticated',
		ready: async (page) => {
			await page.getByText('Tecnología', { exact: true }).waitFor();
		}
	},
	{
		name: 'profile',
		path: '/profile',
		session: 'authenticated',
		ready: async (page) => {
			await page.getByRole('heading', { level: 1 }).first().waitFor();
		}
	},
	{
		name: 'business space',
		path: '/business',
		session: 'business',
		ready: async (page) => {
			await page.getByText('Comercio afiliado').waitFor();
		}
	},
	{
		name: 'business new offer',
		path: '/business/new-offer',
		session: 'business',
		ready: async (page) => {
			await page.getByText('Tecnología', { exact: true }).waitFor();
		}
	},
	{
		name: 'admin dashboard',
		path: '/admin',
		session: 'root',
		ready: async (page) => {
			await page.getByRole('heading', { level: 1 }).first().waitFor();
		}
	},
	{
		name: 'admin merchants',
		path: '/admin/merchants',
		session: 'admin',
		ready: async (page) => {
			await page.getByRole('row', { name: /Comercio pendiente/ }).waitFor();
		}
	},
	{
		name: 'root accounts',
		path: '/admin/accounts',
		session: 'root',
		ready: async (page) => {
			await page.getByRole('row', { name: /clienteuno/ }).waitFor();
		}
	},
	{
		name: 'root claims',
		path: '/admin/claims',
		session: 'root',
		ready: async (page) => {
			await page.getByRole('row', { name: /empresauno/ }).waitFor();
		}
	}
];

for (const screen of A11Y_SCREENS) {
	test(`a11y: ${screen.name} has no serious axe violations`, async ({ page, context }) => {
		if (screen.session) {
			await context.addCookies([
				{ name: 'e2e_session', value: screen.session, url: 'http://127.0.0.1:4173' }
			]);
		}

		await page.goto(screen.path);
		await screen.ready(page);

		const results = await new AxeBuilder({ page }).analyze();
		const serious = results.violations.filter(
			(violation) => violation.impact === 'critical' || violation.impact === 'serious'
		);

		expect(
			serious,
			serious
				.map(
					(violation) =>
						`${violation.id} (${violation.impact}): ${violation.help}\n` +
						violation.nodes.map((node) => `  ${node.target.join(' ')}`).join('\n')
				)
				.join('\n\n')
		).toEqual([]);
	});
}

test('keyboard: the skip link is first in tab order and moves focus to main', async ({ page }) => {
	await page.goto('/');

	// First Tab lands on the (visually hidden until focused) skip link.
	await page.keyboard.press('Tab');
	const skipLink = page.getByRole('link', { name: 'Saltar al contenido principal' });
	await expect(skipLink).toBeFocused();

	// Activating it moves the focus to the main landmark.
	await page.keyboard.press('Enter');
	await expect(page.locator('#main-content')).toBeFocused();
});

test('keyboard: the user menu opens from the avatar button', async ({ page, context }) => {
	await context.addCookies([
		{ name: 'e2e_session', value: 'authenticated', url: 'http://127.0.0.1:4173' }
	]);

	await page.goto('/');

	// The avatar trigger is a real, labelled button — focus it and open the menu.
	await page.getByRole('button', { name: 'Menú de usuario' }).focus();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('link', { name: 'Mi perfil' })).toBeVisible();
});

test('theme: follows the OS preference and toggles from the header moon button', async ({
	page
}) => {
	// Dark OS preference is picked up without any stored choice.
	await page.emulateMedia({ colorScheme: 'dark' });
	await page.goto('/');
	await expect(page.locator('html')).toHaveClass(/dark/);

	// The toggle switches to light and persists the explicit choice.
	await page.getByRole('button', { name: 'Activar el modo claro' }).click();
	await expect(page.locator('html')).not.toHaveClass(/dark/);
	expect(await page.evaluate(() => localStorage.getItem('ofertando.theme'))).toBe('light');

	// The stored choice wins over the OS preference after a reload.
	await page.reload();
	await expect(page.locator('html')).not.toHaveClass(/dark/);

	// And back to dark from the moon button.
	await page.getByRole('button', { name: 'Activar el modo oscuro' }).click();
	await expect(page.locator('html')).toHaveClass(/dark/);
	expect(await page.evaluate(() => localStorage.getItem('ofertando.theme'))).toBe('dark');
});

test('a11y: dark mode home has no serious axe violations', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'dark' });
	await page.goto('/');
	await expect(page.locator('html')).toHaveClass(/dark/);
	await page.getByRole('heading', { level: 1 }).first().waitFor();

	const results = await new AxeBuilder({ page }).analyze();
	const serious = results.violations.filter(
		(violation) => violation.impact === 'critical' || violation.impact === 'serious'
	);
	expect(
		serious,
		serious
			.map(
				(violation) =>
					`${violation.id} (${violation.impact}): ${violation.help}\n` +
					violation.nodes.map((node) => `  ${node.target.join(' ')}`).join('\n')
			)
			.join('\n\n')
	).toEqual([]);
});

test('i18n: switching the language lazy-loads the locale and updates the UI', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: 'Inicio', exact: true })).toBeVisible();

	// French is code-split: picking it fetches the chunk then swaps the texts.
	await page.getByLabel('Idioma').selectOption('fr');
	await expect(page.getByRole('link', { name: 'Accueil', exact: true })).toBeVisible();

	// The choice persists across a reload (and the chunk comes from cache).
	await page.reload();
	await expect(page.getByRole('link', { name: 'Accueil', exact: true })).toBeVisible();
});

test('healthz: answers ok for supervision probes, deep mode included', async ({ request }) => {
	const shallow = await request.get('/healthz');
	expect(shallow.status()).toBe(200);
	expect(await shallow.json()).toMatchObject({ status: 'ok' });

	const deep = await request.get('/healthz?deep=1');
	expect(deep.status()).toBe(200);
	expect(await deep.json()).toMatchObject({ status: 'ok', api: 'ok' });
});
