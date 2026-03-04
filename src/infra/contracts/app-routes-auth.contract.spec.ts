import { describe, expect, it } from 'vitest';
import { appRoutes } from 'app/app.routes';

describe('App routes auth contract', () => {
    it('redirects root to sign-in and does not expose home route', () => {
        const rootRedirect = appRoutes.find((route) => route.path === '' && route.pathMatch === 'full');
        expect(rootRedirect?.redirectTo).toBe('sign-in');

        const pagesGroup = appRoutes.find(
            (route) => route.path === '' && Array.isArray(route.children) && route.children.some((child) => child.path === 'library')
        );

        expect(pagesGroup).toBeTruthy();
        expect(pagesGroup?.children?.some((child) => child.path === 'home')).toBe(false);
    });

    it('requires auth for main pages and hides drawer on sign-in', () => {
        const guestGroup = appRoutes.find(
            (route) => route.path === '' && Array.isArray(route.children) && route.children.some((child) => child.path === 'sign-in')
        );
        const signInRoute = guestGroup?.children?.find((child) => child.path === 'sign-in');
        expect(signInRoute?.data?.['hideNavigationDrawer']).toBe(true);

        const pagesGroup = appRoutes.find(
            (route) => route.path === '' && Array.isArray(route.children) && route.children.some((child) => child.path === 'library')
        );

        expect(Array.isArray(pagesGroup?.canActivate)).toBe(true);
        expect(Array.isArray(pagesGroup?.canActivateChild)).toBe(true);
    });
});
