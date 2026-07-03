// Boots the built app (vite preview) plus a tiny mock backend so Lighthouse
// CI can audit the public screens without the real API. Mirrors the e2e
// setup: preview on 4173, mock on 4174 (BACK_URL).
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';

const OFFER = {
	id: 'lh-offer',
	title: 'Gran descuento de prueba',
	description: 'Una descripción de prueba suficientemente larga para el detalle.',
	offerType: 'discount',
	isOnline: true,
	externalUrl: 'https://example.com/promo',
	startDate: '2026-05-01T00:00:00.000Z',
	endDate: '2026-12-31T00:00:00.000Z',
	status: 'ACTIVE',
	score: 12,
	reportCount: 0,
	commentCount: 0,
	createdAt: '2026-05-01T10:00:00.000Z',
	updatedAt: '2026-05-01T10:00:00.000Z',
	createdById: 'author-1',
	createdByUsername: 'autor',
	userVote: null,
	categories: [{ id: 'cat-technology', slug: 'technology', name: 'Technology' }],
	merchant: { id: 'm-1', name: 'Acme Store', verified: true, blocked: false },
	location: null,
	official: true,
	viewCount: 10,
	clickCount: 3
};

function sendJson(response, statusCode, body) {
	response.writeHead(statusCode, { 'Content-Type': 'application/json' });
	response.end(JSON.stringify(body));
}

// Session cookies mirror the e2e mock so the private screens (business space,
// ROOT back-office) can be audited too: e2e_session=business | root.
function sessionOf(request) {
	const cookie = request.headers.cookie ?? '';
	if (cookie.includes('e2e_session=root')) return 'root';
	if (cookie.includes('e2e_session=business')) return 'business';
	return null;
}

const mock = createServer((request, response) => {
	const url = request.url ?? '';
	const session = sessionOf(request);

	if (url.startsWith('/users/me')) {
		if (!session) {
			sendJson(response, 401, { key: 'auth.unauthorized', statusCode: 401 });
			return;
		}
		sendJson(response, 200, {
			id: `lh-${session}`,
			email: `${session}@example.com`,
			username: `lh${session}`,
			role: session === 'root' ? 'ROOT' : 'USER',
			accountType: session === 'business' ? 'BUSINESS' : 'INDIVIDUAL',
			status: 'ACTIVE',
			reputation: 10,
			createdAt: '2026-05-01T10:00:00.000Z',
			updatedAt: '2026-05-01T10:00:00.000Z'
		});
		return;
	}
	if (url.startsWith('/auth/refresh')) {
		sendJson(response, 401, { key: 'auth.unauthorized', statusCode: 401 });
		return;
	}
	if (url === '/business/me') {
		sendJson(response, 200, {
			user: null,
			merchant: {
				id: 'm-1',
				name: 'Acme Store',
				verified: true,
				blockedAt: null,
				createdAt: '2026-05-01T10:00:00.000Z'
			},
			claim: {
				id: 'c-1',
				status: 'APPROVED',
				createdAt: '2026-05-01T10:00:00.000Z',
				resolvedAt: '2026-05-02T10:00:00.000Z'
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
	if (url === '/offers/mine' || url.startsWith('/offers/mine?')) {
		sendJson(response, 200, { items: [OFFER], nextCursor: null, total: 1 });
		return;
	}
	if (url === '/admin/moderation/summary') {
		sendJson(response, 200, { pendingComments: 2, pendingOfferReports: 1 });
		return;
	}
	if (url.startsWith('/admin/accounts')) {
		sendJson(response, 200, {
			items: [
				{
					id: 'acc-1',
					email: 'cliente@example.com',
					username: 'clienteuno',
					role: 'USER',
					accountType: 'INDIVIDUAL',
					status: 'ACTIVE',
					reputation: 3,
					createdAt: '2026-06-01T10:00:00.000Z',
					updatedAt: '2026-06-01T10:00:00.000Z'
				}
			],
			nextCursor: null
		});
		return;
	}
	if (url.startsWith('/admin/claims')) {
		sendJson(response, 200, {
			items: [
				{
					id: 'claim-1',
					status: 'PENDING',
					note: null,
					createdAt: '2026-06-18T10:00:00.000Z',
					resolvedAt: null,
					user: { id: 'acc-2', email: 'empresa@example.com', username: 'empresauno' },
					merchant: { id: 'm-1', name: 'Acme Store' },
					reviewedBy: null
				}
			],
			nextCursor: null
		});
		return;
	}
	if (url.startsWith('/admin/merchants')) {
		sendJson(response, 200, {
			items: [
				{
					id: 'm-2',
					name: 'Comercio pendiente',
					verified: false,
					blockedAt: null,
					createdAt: '2026-06-01T10:00:00.000Z'
				}
			],
			nextCursor: null
		});
		return;
	}
	if (url.startsWith('/admin/locations')) {
		sendJson(response, 200, { items: [], nextCursor: null });
		return;
	}
	if (url === '/offers/facets') {
		sendJson(response, 200, { cities: [], categories: [] });
		return;
	}
	if (url === '/categories') {
		sendJson(response, 200, OFFER.categories);
		return;
	}
	if (/^\/offers\/[^/?]+\/(view|click)$/.test(url) && request.method === 'POST') {
		response.writeHead(204);
		response.end();
		return;
	}
	if (/^\/offers\/lh-offer\/comments/.test(url)) {
		sendJson(response, 200, { items: [], nextCursor: null });
		return;
	}
	if (url === '/offers/lh-offer' || url.startsWith('/offers/lh-offer?')) {
		sendJson(response, 200, OFFER);
		return;
	}
	if (url === '/offers' || url.startsWith('/offers?')) {
		sendJson(response, 200, { items: [OFFER], nextCursor: null, total: 1 });
		return;
	}
	sendJson(response, 404, { key: 'error.not_found', statusCode: 404 });
});

mock.listen(4174, '127.0.0.1', () => {
	const preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1'], {
		env: { ...process.env, BACK_URL: 'http://127.0.0.1:4174' },
		stdio: ['ignore', 'pipe', 'inherit']
	});
	preview.stdout.on('data', (chunk) => {
		process.stdout.write(chunk);
		if (String(chunk).includes('4173')) {
			console.log('lh server ready');
		}
	});
	const stop = () => {
		preview.kill();
		mock.close();
		process.exit(0);
	};
	process.on('SIGINT', stop);
	process.on('SIGTERM', stop);
});
