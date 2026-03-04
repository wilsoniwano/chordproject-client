import { describe, expect, it } from 'vitest';
import {
    addNormalizedInitial,
    filterSongbooksByName,
    filterSongsByLyrics,
    sortSongbooksByEventDateDesc,
    filterSongsByTitle,
    limitItems,
    sortSongbooksByName,
    sortSongsByTitle,
} from './search-index';

describe('search-index domain', () => {
    it('filters songs by title accent-insensitive', () => {
        const songs = [
            { uid: '1', title: 'Coração', uniqueChords: [] },
            { uid: '2', title: 'Louvor', uniqueChords: [] },
        ];

        expect(filterSongsByTitle(songs, 'coracao')).toHaveLength(1);
        expect(filterSongsByTitle(songs, 'coracao')[0].uid).toBe('1');
    });

    it('filters songs by lyrics accent-insensitive', () => {
        const songs = [
            { uid: '1', lyrics: 'Deus é bom', uniqueChords: [] },
            { uid: '2', lyrics: 'Aleluia', uniqueChords: [] },
        ];

        expect(filterSongsByLyrics(songs, 'deus e bom')).toHaveLength(1);
        expect(filterSongsByLyrics(songs, 'deus e bom')[0].uid).toBe('1');
    });

    it('returns original collections when search term is empty', () => {
        const songs = [{ uid: '1', title: 'Teste', uniqueChords: [] }];
        const songbooks = [{ uid: '1', name: 'Lista' }] as any;

        expect(filterSongsByTitle(songs, '')).toEqual(songs);
        expect(filterSongsByLyrics(songs, undefined)).toEqual(songs);
        expect(filterSongbooksByName(songbooks, '')).toEqual(songbooks);
    });

    it('sorts songs and adds normalized initial', () => {
        const songs = [
            { uid: '2', title: 'Bola', uniqueChords: [] },
            { uid: '1', title: 'Árvore', uniqueChords: [] },
        ];

        const sorted = sortSongsByTitle(songs);
        expect(sorted.map((s) => s.uid)).toEqual(['1', '2']);

        const withInitial = addNormalizedInitial(sorted);
        expect((withInitial[0] as any).normalizedInitial).toBe('A');
    });

    it('sorts songs even when title is missing', () => {
        const songs = [
            { uid: '1', uniqueChords: [] },
            { uid: '2', title: 'Bravo', uniqueChords: [] },
            { uid: '3', uniqueChords: [] },
        ] as any;

        const sorted = sortSongsByTitle(songs);
        expect(sorted.map((s) => s.uid)).toEqual(['1', '3', '2']);
    });

    it('handles missing title/lyrics/name fields safely', () => {
        const songs = [
            { uid: '1', uniqueChords: [] },
            { uid: '2', title: 'Alpha', uniqueChords: [] },
            { uid: '3', lyrics: 'Beta', uniqueChords: [] },
        ] as any;
        const songbooks = [{ uid: '1' }, { uid: '2', name: 'Árvore' }] as any;

        expect(filterSongsByTitle(songs, 'alpha').map((s) => s.uid)).toEqual(['2']);
        expect(filterSongsByLyrics(songs, 'beta').map((s) => s.uid)).toEqual(['3']);
        expect(filterSongbooksByName(songbooks, 'arvore').map((s) => s.uid)).toEqual(['2']);

        const withInitial = addNormalizedInitial(songs);
        expect((withInitial[0] as any).normalizedInitial).toBe('');
    });

    it('filters and sorts songbooks by name', () => {
        const songbooks = [
            { uid: '1', name: 'Zeta' },
            { uid: '2', name: 'Álbum' },
        ] as any;

        const filtered = filterSongbooksByName(songbooks, 'album');
        expect(filtered).toHaveLength(1);
        expect(filtered[0].uid).toBe('2');

        const sorted = sortSongbooksByName(songbooks);
        expect(sorted.map((s) => s.uid)).toEqual(['2', '1']);
    });

    it('sorts songbooks even when name is missing', () => {
        const songbooks = [{ uid: '1' }, { uid: '2', name: 'B' }, { uid: '3' }] as any;
        const sorted = sortSongbooksByName(songbooks);
        expect(sorted.map((s) => s.uid)).toEqual(['1', '3', '2']);
    });

    it('sorts songbooks by event date descending', () => {
        const songbooks = [
            { uid: '1', name: 'A', eventDate: '2026-03-01' },
            { uid: '2', name: 'B', eventDate: '2026-05-10' },
            { uid: '3', name: 'C', eventDate: '2025-12-31' },
        ] as any;

        const sorted = sortSongbooksByEventDateDesc(songbooks);
        expect(sorted.map((s) => s.uid)).toEqual(['2', '1', '3']);
    });

    it('keeps songbooks without event date at the end', () => {
        const songbooks = [
            { uid: '1', name: 'A' },
            { uid: '2', name: 'B', eventDate: '2026-01-01' },
            { uid: '3', name: 'C', eventDate: '' },
        ] as any;

        const sorted = sortSongbooksByEventDateDesc(songbooks);
        expect(sorted.map((s) => s.uid)).toEqual(['2', '1', '3']);
    });

    it('limits arrays when limit is provided', () => {
        expect(limitItems([1, 2, 3], 2)).toEqual([1, 2]);
        expect(limitItems([1, 2, 3], undefined)).toEqual([1, 2, 3]);
        expect(limitItems([1, 2, 3], 0)).toEqual([1, 2, 3]);
    });
});
