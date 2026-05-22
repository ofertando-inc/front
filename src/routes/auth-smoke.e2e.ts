import { expect, test } from '@playwright/test';
import { createServer, type Server } from 'node:http';

let mockBackend: Server;

function sendJson(response: import('node:http').ServerResponse, statusCode: number, body: unknown) {
	response.writeHead(statusCode, { 'Content-Type': 'application/json' });
	response.end(JSON.stringify(body));
}

test.beforeAll(async () => {
	mockBackend = createServer((request, response) => {
		const url = request.url ?? '/';

		if (url.startsWith('/users/me') || url.startsWith('/auth/refresh')) {
			sendJson(response, 401, {
				key: 'auth.unauthorized',
				statusCode: 401
			});
			return;
		}

		if (url === '/offers' || url.startsWith('/offers?')) {
			sendJson(response, 200, { items: [], nextCursor: null });
			return;
		}

		if (url.startsWith('/offers/')) {
			sendJson(response, 404, {
				key: 'offer.not_found',
				statusCode: 404
			});
			return;
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

test('never persists an auth token in localStorage (cookie-only session)', async ({ page }) => {
	await page.goto('/');

	const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
	expect(localStorageKeys).not.toContain('ofertando.accessToken');
	expect(localStorageKeys.filter((key) => key.toLowerCase().includes('token'))).toEqual([]);
});
