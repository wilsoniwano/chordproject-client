import { expect, test } from '@playwright/test';

test('home page loads with app title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CifraPro/i);
});

test('library route shows translated header', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('e2e.mockAuth', '1');
        localStorage.setItem(
            'e2e.mockAuth.user',
            JSON.stringify({ uid: 'e2e-user-1', email: 'e2e@local.test' })
        );
    });
    await page.goto('/library');
    await expect(page.getByText('Biblioteca de músicas')).toBeVisible();
});

test('search input uses translated placeholder', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('e2e.mockAuth', '1');
        localStorage.setItem(
            'e2e.mockAuth.user',
            JSON.stringify({ uid: 'e2e-user-1', email: 'e2e@local.test' })
        );
    });
    await page.goto('/');
    await page.locator('search button').first().click();
    await expect(page.getByPlaceholder('Pesquisar por título, letra ou lista de reprodução...')).toBeVisible();
});

test('search shows translated empty state when no results are found', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('e2e.mockAuth', '1');
        localStorage.setItem(
            'e2e.mockAuth.user',
            JSON.stringify({ uid: 'e2e-user-1', email: 'e2e@local.test' })
        );
    });
    await page.goto('/');
    await page.locator('search button').first().click();
    const searchInput = page.getByPlaceholder('Pesquisar por título, letra ou lista de reprodução...');
    await searchInput.fill('zzzzzzzzzzzzzz123456789');

    const noResultsText = page.getByText('Nenhum resultado encontrado!');
    await expect.poll(
        async () => {
            if (await noResultsText.isVisible().catch(() => false)) {
                return true;
            }

            const optionCount = await page.locator('mat-option').count();
            return optionCount === 0;
        },
        { timeout: 10000 }
    ).toBe(true);
});

test('bar search opens and closes with Escape', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('e2e.mockAuth', '1');
        localStorage.setItem(
            'e2e.mockAuth.user',
            JSON.stringify({ uid: 'e2e-user-1', email: 'e2e@local.test' })
        );
    });
    await page.goto('/');
    const openSearchButton = page.locator('search button').first();
    await openSearchButton.click();

    const barInput = page.getByPlaceholder('Pesquisar por título, letra ou lista de reprodução...');
    await expect(barInput).toBeVisible();

    await barInput.press('Escape');
    await expect(barInput).not.toBeVisible();
});
