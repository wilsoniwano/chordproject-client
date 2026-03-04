import '@angular/compiler';
import { BehaviorSubject, Subject, firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SongService } from './song.service';

describe('SongService (mock mode)', () => {
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
        const service = Object.create(SongService.prototype) as any;
        service._mockMode = true;
        service._song = new BehaviorSubject(null);
        service._songsChanged = new Subject<void>();
        return service;
    }

    beforeEach(() => {
        (globalThis as any).window = {
            localStorage: createLocalStorageMock(),
        };
        window.localStorage.clear();
        window.localStorage.setItem('e2e.mockData', '1');
    });

    it('denies save when not authenticated', async () => {
        const service = createService();
        const result = await service.save({ title: 'Song', content: '{title: Song}' });
        expect(result).toBeNull();
    });

    it('creates and updates songs when authenticated', async () => {
        const service = createService();
        window.localStorage.setItem(
            'e2e.mockAuth.user',
            JSON.stringify({ uid: 'e2e-user-1', email: 'e2e@local.test' })
        );

        const createdId = await service.save({
            title: 'First',
            content: '{title: First}\n[C]Hello',
            uniqueChords: ['C'],
        });
        expect(createdId).toBeTruthy();

        let stored = JSON.parse(window.localStorage.getItem('e2e.mockSongs') || '[]');
        expect(stored).toHaveLength(1);
        expect(stored[0].title).toBe('First');

        await service.save({
            uid: createdId,
            title: 'First Updated',
            content: '{title: First Updated}\n[C]Hello',
            uniqueChords: ['C'],
        });
        stored = JSON.parse(window.localStorage.getItem('e2e.mockSongs') || '[]');
        expect(stored).toHaveLength(1);
        expect(stored[0].title).toBe('First Updated');
    });

    it('deletes songs in mock mode', async () => {
        const service = createService();
        window.localStorage.setItem(
            'e2e.mockAuth.user',
            JSON.stringify({ uid: 'e2e-user-1', email: 'e2e@local.test' })
        );
        window.localStorage.setItem(
            'e2e.mockSongs',
            JSON.stringify([{ uid: 'song-1', title: 'To delete', uniqueChords: [] }])
        );

        const changedSpy = vi.fn();
        service.songsChanged$.subscribe(changedSpy);

        const result = await service.delete('song-1');
        expect(result).toBe(true);

        const stored = JSON.parse(window.localStorage.getItem('e2e.mockSongs') || '[]');
        expect(stored).toEqual([]);
        expect(changedSpy).toHaveBeenCalled();
    });

    it('maps errors to thrown observable with snackbar message', async () => {
        const service = createService();
        const open = vi.fn();
        service._snackBar = { open };

        const error$ = service.handleError(new Error('boom'));
        await expect(firstValueFrom(error$)).rejects.toThrow('boom');
        expect(open).toHaveBeenCalled();
    });
});
