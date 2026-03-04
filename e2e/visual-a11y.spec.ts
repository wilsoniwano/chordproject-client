import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function enableMockAuth(page: any): Promise<void> {
    await page.addInitScript(() => {
        localStorage.setItem('e2e.mockAuth', '1');
        localStorage.setItem(
            'e2e.mockAuth.user',
            JSON.stringify({ uid: 'e2e-user-1', email: 'e2e@local.test' })
        );
    });
}

test('visual smoke captures non-empty screenshots for key pages', async ({ page }) => {
    await enableMockAuth(page);
    await page.goto('/songbook');
    const homeShot = await page.screenshot();
    expect(homeShot.byteLength).toBeGreaterThan(6_000);

    await page.goto('/library');
    const libraryShot = await page.screenshot();
    expect(libraryShot.byteLength).toBeGreaterThan(6_000);
});

test('a11y scan runs on home and keeps serious/critical issues within baseline', async ({ page }) => {
    await enableMockAuth(page);
    await page.goto('/songbook');
    const homeResults = await new AxeBuilder({ page }).analyze();
    const seriousOrCriticalHome = homeResults.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact || '')
    );
    expect(seriousOrCriticalHome.length).toBeLessThanOrEqual(6);
});
