import { expect, test } from '@playwright/test';

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

test('profile redirects unauthenticated users to login', async ({ page }) => {
	await page.goto('/profile');

	await expect(page).toHaveURL(/\/login$/);
	await expect(page.getByRole('heading', { name: 'Inicia sesión' }).first()).toBeVisible();
});
