import { describe, expect, it } from 'vitest';
import { buildSearchResultSets, shouldRunSearch } from './search.usecase';

describe('search use case', () => {
    it('runs only when search term reaches min length', () => {
        expect(shouldRunSearch('', 2)).toBe(false);
        expect(shouldRunSearch('a', 2)).toBe(false);
        expect(shouldRunSearch('ab', 2)).toBe(true);
    });

    it('deduplicates songsContent already present in songs', () => {
        const result = buildSearchResultSets({
            songs: [{ uid: '1', title: 'Song A', uniqueChords: [] }],
            songsContent: [
                { uid: '1', title: 'Song A', uniqueChords: [] },
                { uid: '2', title: 'Song B', uniqueChords: [] },
            ],
            songbooks: [],
            songsInSongbooks: [],
        });

        expect(result.songsContent).toHaveLength(1);
        expect(result.songsContent?.[0].uid).toBe('2');
    });
});

