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

test('search shows translated empty state when no results are found', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByPlaceholder('Pesquisar por título, letra ou lista de reprodução');
    await searchInput.fill('zzzzzzzzzzzzzz123456789');
    await expect(page.getByText('Nenhum resultado encontrado!')).toBeVisible();
});

test('bar search opens and closes with Escape', async ({ page }) => {
    await page.goto('/');
    const openSearchButton = page.locator('search button').first();
    await openSearchButton.click();

    const barInput = page.getByPlaceholder('Pesquisar por título, letra ou lista de reprodução...');
    await expect(barInput).toBeVisible();

    await barInput.press('Escape');
    await expect(barInput).not.toBeVisible();
});
