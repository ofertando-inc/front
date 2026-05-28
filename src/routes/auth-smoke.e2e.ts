import { expect, test } from '@playwright/test';
import { createServer, type Server } from 'node:http';

let mockBackend: Server;

function sendJson(response: import('node:http').ServerResponse, statusCode: number, body: unknown) {
	response.writeHead(statusCode, { 'Content-Type': 'application/json' });
	response.end(JSON.stringify(body));
}

function isAuthenticated(request: import('node:http').IncomingMessage) {
	const cookie = request.headers.cookie ?? '';
	return cookie.includes('e2e_session=authenticated') || cookie.includes('e2e_session=admin');
}

function isAdmin(request: import('node:http').IncomingMessage) {
	return (request.headers.cookie ?? '').includes('e2e_session=admin');
}

test.beforeAll(async () => {
	mockBackend = createServer((request, response) => {
		const url = request.url ?? '/';

		if (url.startsWith('/users/me')) {
			if (isAuthenticated(request)) {
				const admin = isAdmin(request);
				sendJson(response, 200, {
					id: admin ? 'e2e-admin-id' : 'e2e-user-id',
					email: admin ? 'admin@example.com' : 'e2e@example.com',
					username: admin ? 'e2eadmin' : 'e2euser',
					role: admin ? 'ADMIN' : 'USER',
					status: 'ACTIVE',
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

			sendJson(response, 200, { items: [], nextCursor: null });
			return;
		}

		if (url === '/offers' || url.startsWith('/offers?')) {
			sendJson(response, 200, { items: [], nextCursor: null });
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

		if (url === '/offers/e2e-report-offer' || url.startsWith('/offers/e2e-report-offer?')) {
			sendJson(response, 200, {
				id: 'e2e-report-offer',
				title: 'Oferta de prueba de reporte',
				description: 'Descripción de la oferta para el test de reporte.',
				offerType: 'online',
				externalUrl: 'https://example.com/promo',
				storeName: 'TestStore',
				city: 'Bogotá',
				startDate: '2026-05-01T00:00:00.000Z',
				endDate: '2026-12-31T00:00:00.000Z',
				status: 'ACTIVE',
				score: 0,
				reportCount: 0,
				createdAt: '2026-05-01T10:00:00.000Z',
				updatedAt: '2026-05-01T10:00:00.000Z',
				createdById: 'other-author',
				createdByUsername: 'other-author',
				userVote: null
			});
			return;
		}

		if (url === '/offers/e2e-vote-offer' || url.startsWith('/offers/e2e-vote-offer?')) {
			sendJson(response, 200, {
				id: 'e2e-vote-offer',
				title: 'Oferta de prueba de votación',
				description: 'Descripción de la oferta para el test de votación.',
				offerType: 'online',
				externalUrl: 'https://example.com/promo',
				storeName: 'TestStore',
				city: 'Bogotá',
				startDate: '2026-05-01T00:00:00.000Z',
				endDate: '2026-12-31T00:00:00.000Z',
				status: 'ACTIVE',
				score: 15,
				reportCount: 0,
				createdAt: '2026-05-01T10:00:00.000Z',
				updatedAt: '2026-05-01T10:00:00.000Z',
				createdById: 'other-author',
				createdByUsername: 'other-author',
				userVote: null
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

		if (url.startsWith('/admin/')) {
			if (!isAuthenticated(request)) {
				sendJson(response, 401, { key: 'auth.unauthorized', statusCode: 401 });
				return;
			}
			if (!isAdmin(request)) {
				sendJson(response, 403, { key: 'auth.forbidden', statusCode: 403 });
				return;
			}

			const adminOffer = {
				id: 'e2e-admin-offer',
				title: 'Oferta moderable',
				description: 'Oferta usada por el test admin.',
				offerType: 'online',
				externalUrl: 'https://example.com/promo',
				storeName: 'TestStore',
				city: 'Bogotá',
				startDate: '2026-05-01T00:00:00.000Z',
				endDate: '2026-12-31T00:00:00.000Z',
				status: 'ACTIVE',
				score: 4,
				reportCount: 2,
				createdAt: '2026-05-01T10:00:00.000Z',
				updatedAt: '2026-05-01T10:00:00.000Z',
				createdById: 'author-id',
				createdByUsername: 'autor-test',
				userVote: null
			};

			if (url === '/admin/offers' || url.startsWith('/admin/offers?')) {
				sendJson(response, 200, { items: [adminOffer], nextCursor: null });
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
	await expect(main.getByText('Mis ofertas')).toBeVisible();
	await expect(main.getByText('Aún no has publicado ofertas.')).toBeVisible();
	await expect(main.getByText('Publica tu primera oferta para que aparezca aquí.')).toBeVisible();
	await expect(main.getByRole('link', { name: 'Publicar oferta' })).toBeVisible();
});

test('create deal redirects unauthenticated users to login', async ({ page }) => {
	await page.goto('/create-deal');

	await expect(page).toHaveURL(/\/login$/);
	await expect(page.getByRole('heading', { name: 'Inicia sesión' }).first()).toBeVisible();
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

	await page.goto('/admin');

	await expect(page.getByRole('heading', { name: 'Panel de administración' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Oferta moderable' })).toBeVisible();

	await page.getByRole('button', { name: 'Desactivar', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Restaurar' })).toBeVisible();
});

test('admin reports tab lists pending reports for an admin', async ({ page, context }) => {
	await context.addCookies([{ name: 'e2e_session', value: 'admin', url: 'http://127.0.0.1:4173' }]);

	await page.goto('/admin/reports');

	await expect(page.getByRole('link', { name: 'Oferta moderable' })).toBeVisible();
	await expect(page.getByText('Parece una estafa')).toBeVisible();
	await expect(page.getByText('reportante')).toBeVisible();
});

test('never persists an auth token in localStorage (cookie-only session)', async ({ page }) => {
	await page.goto('/');

	const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
	expect(localStorageKeys).not.toContain('ofertando.accessToken');
	expect(localStorageKeys.filter((key) => key.toLowerCase().includes('token'))).toEqual([]);
});
