import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('visual smoke captures non-empty screenshots for key pages', async ({ page }) => {
    await page.goto('/home');
    const homeShot = await page.screenshot();
    expect(homeShot.byteLength).toBeGreaterThan(6_000);

    await page.goto('/library');
    const libraryShot = await page.screenshot();
    expect(libraryShot.byteLength).toBeGreaterThan(6_000);
});

test('a11y scan runs on home and keeps serious/critical issues within baseline', async ({ page }) => {
    await page.goto('/home');
    const homeResults = await new AxeBuilder({ page }).analyze();
    const seriousOrCriticalHome = homeResults.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact || '')
    );
    expect(seriousOrCriticalHome.length).toBeLessThanOrEqual(6);
});
