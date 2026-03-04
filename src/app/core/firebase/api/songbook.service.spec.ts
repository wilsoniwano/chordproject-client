import { of, firstValueFrom } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { SongbookService } from './songbook.service';

describe('SongbookService', () => {
    function createService(): any {
        return Object.create(SongbookService.prototype) as SongbookService & any;
    }

    it('searchSongsInSongbooks merges title/lyrics matches and limits groups', async () => {
        const service = createService();
        service.getAll = vi.fn().mockReturnValue(
            of([
                { uid: 'sb1', name: 'One' },
                { uid: 'sb2', name: 'Two' },
            ])
        );
        service.getContent = vi.fn().mockImplementation((uid: string) =>
            of(
                uid === 'sb1'
                    ? [
                          { uid: 's1', title: 'Alpha Song', lyrics: 'word', uniqueChords: [] },
                          { uid: 's2', title: 'Beta', lyrics: 'alpha lyric', uniqueChords: [] },
                      ]
                    : [{ uid: 's3', title: 'Gamma', lyrics: 'none', uniqueChords: [] }]
            )
        );

        const result = await firstValueFrom(service.searchSongsInSongbooks('alpha', 1, 5));
        expect(result).toHaveLength(1);
        expect(result[0].songbook.uid).toBe('sb1');
        expect(result[0].songs.map((s) => s.uid).sort()).toEqual(['s1', 's2']);
    });

    it('updateSongOrder returns false when not authenticated', async () => {
        const service = createService();
        service.verifyAuthentication = vi.fn().mockReturnValue(false);

        const result = await firstValueFrom(service.updateSongOrder('sb1', [{ songId: 's1', order: 1 }]));
        expect(result).toBe(false);
    });
});

