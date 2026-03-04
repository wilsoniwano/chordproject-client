import { expect, test } from '@playwright/test';

test('home page loads with app title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ChordProject/i);
});

test('library route shows translated header', async ({ page }) => {
    await page.goto('/library');
    await expect(page.getByText('Biblioteca de músicas')).toBeVisible();
});

test('search input uses translated placeholder', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByPlaceholder('Pesquisar por título, letra ou lista de reprodução')).toBeVisible();
});
