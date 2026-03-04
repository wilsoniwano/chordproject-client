import { describe, expect, it } from 'vitest';
import { getAuthGuardRedirectUrl, getNoAuthGuardTarget } from './guard.usecase';

describe('guard use case', () => {
    it('builds auth guard redirect urls for unauthenticated users', () => {
        expect(getAuthGuardRedirectUrl('/songs/create', false)).toBe('sign-in?redirectURL=/songs/create');
        expect(getAuthGuardRedirectUrl('/sign-out', false)).toBe('sign-in?');
    });

    it('allows authenticated users in auth guard', () => {
        expect(getAuthGuardRedirectUrl('/home', true)).toBe(true);
    });

    it('redirects authenticated users away from guest routes', () => {
        expect(getNoAuthGuardTarget(true)).toBe('/library');
        expect(getNoAuthGuardTarget(false)).toBe(true);
    });
});
