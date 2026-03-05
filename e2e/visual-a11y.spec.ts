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

function expectNonEmptyScreenshot(buffer: Buffer): void {
    // PNG header bytes + practical minimum to avoid flaky size assertions across environments.
    expect(buffer.byteLength).toBeGreaterThan(4_000);
    expect(buffer.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
}

test('visual smoke captures non-empty screenshots for key pages', async ({ page }) => {
    await enableMockAuth(page);
    await page.goto('/songbook');
    const homeShot = await page.screenshot({ fullPage: true });
    expectNonEmptyScreenshot(homeShot);

    await page.goto('/library');
    const libraryShot = await page.screenshot({ fullPage: true });
    expectNonEmptyScreenshot(libraryShot);
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
