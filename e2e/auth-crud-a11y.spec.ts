import { expect, test } from '@playwright/test';

const seedSongs = [
    {
        uid: 'song-e2e-1',
        title: 'E2E Song One',
        lyrics: 'Hello world',
        content: '{title: E2E Song One}\n[C]Hello world',
        uniqueChords: ['C'],
        creationDate: '2026-01-01T00:00:00.000Z',
    },
];

async function enableMockMode(page: any): Promise<void> {
    await page.addInitScript((songs) => {
        localStorage.setItem('e2e.mockAuth', '1');
        localStorage.setItem('e2e.mockData', '1');
        localStorage.setItem('e2e.mockSongs', JSON.stringify(songs));
    }, seedSongs);
}

test('auth guard redirects unauthenticated /sign-out to sign-in', async ({ page }) => {
    await enableMockMode(page);
    await page.goto('/sign-out');
    await expect(page).toHaveURL(/\/sign-in/);
});

test('invalid login shows error message', async ({ page }) => {
    await enableMockMode(page);
    await page.goto('/sign-in');
    await page.getByLabel(/email|e-mail/i).fill('wrong@local.test');
    await page.getByLabel(/password|senha/i).fill('bad-password');
    await page.getByRole('button', { name: /sign in|entrar/i }).click();
    await expect(page.getByText('Invalid credentials', { exact: true })).toBeVisible();
});

test('valid login and logout flow', async ({ page }) => {
    await enableMockMode(page);
    await page.goto('/sign-in');
    await page.getByLabel(/email|e-mail/i).fill('e2e@local.test');
    await page.getByLabel(/password|senha/i).fill('E2Epass123!');
    await page.getByRole('button', { name: /sign in|entrar/i }).click();
    await expect(page).toHaveURL(/\/songbook/);

    await page.goto('/sign-out');
    await expect(page).toHaveURL(/\/sign-in/);
});

test('sign-up flow succeeds in mock mode', async ({ page }) => {
    await enableMockMode(page);
    await page.goto('/sign-up');
    await page.getByLabel(/name|nome/i).fill('E2E User');
    await page.getByLabel('Email').fill('new@local.test');
    await page.getByLabel(/password|senha/i).fill('E2Epass123!');
    const agreeCheckbox = page.getByRole('checkbox', { name: /i agree to the|concordo com os/i });
    await agreeCheckbox.check();
    await expect(agreeCheckbox).toBeChecked();
    await page.getByRole('button', { name: /create an account|criar conta/i }).click();
    await expect.poll(async () =>
        page.evaluate(() => window.localStorage.getItem('e2e.mockAuth.user'))
    ).not.toBeNull();
});

test('forgot-password flow shows success alert', async ({ page }) => {
    await enableMockMode(page);
    await page.goto('/forgot-password');
    await page.getByLabel(/email|e-mail/i).fill('e2e@local.test');
    await page.getByRole('button', { name: /send reset link|enviar link de redefinição/i }).click();
    await expect(
        page.getByText(/Se o e-mail existir, você receberá um link para redefinir sua senha\./i)
    ).toBeVisible();
});

test('library CRUD baseline (read/update/delete on seeded song)', async ({ page }) => {
    await enableMockMode(page);
    await page.addInitScript(() => {
        localStorage.setItem(
            'e2e.mockAuth.user',
            JSON.stringify({ uid: 'e2e-user-1', email: 'e2e@local.test' })
        );
    });

    await page.goto('/library');
    await expect(page.getByText('E2E Song One')).toBeVisible();

    await page.goto('/songs/create/song-e2e-1');
    await page.getByLabel('Save song').click();
    await page.goto('/library');
    await expect(page.getByText('E2E Song One')).toBeVisible();

    await page.goto('/songs/create/song-e2e-1');
    await page.getByLabel('Delete song').click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.goto('/library');
    await expect(page.locator('chp-song-item')).toHaveCount(0);
});

test('language persistence from localStorage', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('e2e.mockAuth', '1');
        localStorage.setItem(
            'e2e.mockAuth.user',
            JSON.stringify({ uid: 'e2e-user-1', email: 'e2e@local.test' })
        );
    });
    await page.addInitScript(() => {
        if (!localStorage.getItem('chp.lang')) {
            localStorage.setItem('chp.lang', 'en');
        }
    });
    await page.goto('/library');
    await expect(page.getByText('Song Library')).toBeVisible();

    await page.evaluate(() => localStorage.setItem('chp.lang', 'pt-br'));
    await page.reload();
    await expect(page.getByText('Adicionar')).toBeVisible();
});

test('home empty state is rendered when there are no mock songs', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('e2e.mockAuth', '1');
        localStorage.setItem(
            'e2e.mockAuth.user',
            JSON.stringify({ uid: 'e2e-user-1', email: 'e2e@local.test' })
        );
        localStorage.setItem('e2e.mockData', '1');
        localStorage.setItem('e2e.mockSongs', JSON.stringify([]));
    });
    await page.goto('/library');
    await expect(page.getByText('Algo deu errado ao carregar as músicas')).toBeVisible();
});

test('keyboard accessibility for search and nav toggle', async ({ page }) => {
    await enableMockMode(page);
    await page.addInitScript(() => {
        localStorage.setItem(
            'e2e.mockAuth.user',
            JSON.stringify({ uid: 'e2e-user-1', email: 'e2e@local.test' })
        );
    });
    await page.goto('/');

    const navToggle = page.getByLabel('Toggle navigation');
    await expect(navToggle).toBeVisible();
    await navToggle.focus();
    await page.keyboard.press('Enter');

    const openSearch = page.getByLabel('Open search');
    await expect(openSearch).toBeVisible();
    await openSearch.focus();
    await page.keyboard.press('Enter');

    const barInput = page.getByPlaceholder('Pesquisar por título, letra ou lista de reprodução...');
    await expect(barInput).toBeVisible();
    await barInput.press('Escape');
    await expect(barInput).not.toBeVisible();
});
