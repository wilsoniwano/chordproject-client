import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService (mock mode)', () => {
    function createLocalStorageMock() {
        const storage = new Map<string, string>();
        return {
            getItem: (key: string) => (storage.has(key) ? storage.get(key)! : null),
            setItem: (key: string, value: string) => storage.set(key, value),
            removeItem: (key: string) => storage.delete(key),
            clear: () => storage.clear(),
        };
    }

    function createService(): any {
        const service = Object.create(AuthService.prototype) as any;
        service._mockMode = true;
        service._user = new BehaviorSubject(null);
        service._authenticated = new BehaviorSubject(false);
        service._snackBar = { open: vi.fn() };
        return service;
    }

    beforeEach(() => {
        (globalThis as any).window = {
            localStorage: createLocalStorageMock(),
        };
        window.localStorage.clear();
        window.localStorage.setItem('e2e.mockAuth', '1');
    });

    it('signs in with valid mock credentials', async () => {
        const service = createService();
        const user = await firstValueFrom(service.signInWithEmail('e2e@local.test', 'E2Epass123!'));
        expect(user.email).toBe('e2e@local.test');
        expect(service._authenticated.value).toBe(true);
    });

    it('rejects invalid mock credentials', async () => {
        const service = createService();
        await expect(
            firstValueFrom(service.signInWithEmail('wrong@local.test', 'bad'))
        ).rejects.toThrow('Invalid credentials');
        expect(service._snackBar.open).toHaveBeenCalled();
    });

    it('creates user and signs out in mock mode', async () => {
        const service = createService();
        const user = await firstValueFrom(service.createUser('new@local.test', 'pass'));
        expect(user.email).toBe('new@local.test');
        expect(service._authenticated.value).toBe(true);

        await firstValueFrom(service.signOut());
        expect(service._authenticated.value).toBe(false);
    });
});

