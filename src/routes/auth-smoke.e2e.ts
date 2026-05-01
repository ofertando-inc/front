import { expect, test } from '@playwright/test';

test('home page renders auth-first landing', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('heading', { name: 'Ofertando' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible();
	await expect(page.getByRole('link', { name: 'Crear cuenta' }).first()).toBeVisible();
});

test('login page renders the login form', async ({ page }) => {
	await page.goto('/login');

	await expect(page.getByRole('heading', { name: 'Inicia sesion' }).first()).toBeVisible();
	await expect(page.getByLabel('Correo electronico')).toBeVisible();
	await expect(page.getByLabel('Contrasena')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
});

test('register page renders the register form', async ({ page }) => {
	await page.goto('/register');

	await expect(page.getByRole('heading', { name: 'Crear cuenta' }).first()).toBeVisible();
	await expect(page.getByLabel('Correo electronico')).toBeVisible();
	await expect(page.getByLabel('Nombre de usuario')).toBeVisible();
	await expect(page.getByLabel('Contrasena')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Registrarme' })).toBeVisible();
});

test('profile redirects unauthenticated users to login', async ({ page }) => {
	await page.goto('/profile');

	await expect(page).toHaveURL(/\/login$/);
	await expect(page.getByRole('heading', { name: 'Inicia sesion' }).first()).toBeVisible();
});
