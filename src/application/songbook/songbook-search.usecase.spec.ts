import { describe, expect, it } from 'vitest';
import {
    finalizeSongbookSearchGroups,
    limitSongbookSongsGroup,
    mergeUniqueSongMatchesByUid,
} from './songbook-search.usecase';

describe('songbook search use case', () => {
    it('merges title and lyrics matches without duplicate uid', () => {
        const merged = mergeUniqueSongMatchesByUid(
            [
                { uid: '1', title: 'A', uniqueChords: [] },
                { uid: '2', title: 'B', uniqueChords: [] },
            ],
            [
                { uid: '2', title: 'B', uniqueChords: [] },
                { uid: '3', title: 'C', uniqueChords: [] },
            ]
        );

        expect(merged.map((s) => s.uid)).toEqual(['1', '2', '3']);
    });

    it('limits songs per songbook', () => {
        const group = limitSongbookSongsGroup(
            {
                songbook: { uid: 'sb1', name: 'Lista 1' } as any,
                songs: [
                    { uid: '1', uniqueChords: [] },
                    { uid: '2', uniqueChords: [] },
                    { uid: '3', uniqueChords: [] },
                ],
            },
            2
        );

        expect(group.songs.map((s) => s.uid)).toEqual(['1', '2']);
    });

    it('removes empty groups and limits number of songbooks', () => {
        const groups = finalizeSongbookSearchGroups(
            [
                { songbook: { uid: '1', name: 'A' } as any, songs: [{ uid: 's1', uniqueChords: [] }] },
                { songbook: { uid: '2', name: 'B' } as any, songs: [] },
                { songbook: { uid: '3', name: 'C' } as any, songs: [{ uid: 's3', uniqueChords: [] }] },
            ],
            1
        );

        expect(groups).toHaveLength(1);
        expect(groups[0].songbook.uid).toBe('1');
    });
});

