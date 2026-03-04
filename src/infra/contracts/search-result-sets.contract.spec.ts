import { describe, expect, it } from 'vitest';
import { isValidSearchResultSets } from './search-result-sets.contract';

describe('search result sets contract', () => {
    it('accepts a valid contract payload', () => {
        expect(
            isValidSearchResultSets({
                songs: [],
                songsContent: [],
                songbooks: [],
                songsInSongbooks: [],
            })
        ).toBe(true);
    });

    it('rejects invalid contract payload', () => {
        expect(isValidSearchResultSets({ songs: [] })).toBe(false);
        expect(isValidSearchResultSets(null)).toBe(false);
        expect(isValidSearchResultSets('invalid')).toBe(false);
        expect(
            isValidSearchResultSets({
                songs: {},
                songbooks: [],
                songsInSongbooks: [],
            })
        ).toBe(false);
        expect(
            isValidSearchResultSets({
                songs: [],
                songbooks: [],
                songsInSongbooks: {},
            })
        ).toBe(false);
    });
});
