import { describe, expect, it } from 'vitest';
import { Relation } from 'app/models/relation';
import { mapSongsWithRelations, sortSongsByRelationOrder } from './songbook-content.usecase';

describe('songbook content use case', () => {
    it('maps relation metadata into songs', () => {
        const songs = [
            { uid: 's1', title: 'B', uniqueChords: [] },
            { uid: 's2', title: 'A', uniqueChords: [] },
        ];
        const relations = [
            Object.assign(new Relation('sb1', 's1'), { order: 2, author_uid: 'u1' }),
            Object.assign(new Relation('sb1', 's2'), { order: 1, author_uid: 'u2' }),
        ];

        const mapped = mapSongsWithRelations(songs as any, relations as Relation[]);
        expect(mapped[0].order).toBe(2);
        expect(mapped[1].author_uid).toBe('u2');
    });

    it('sets null order when relation is missing', () => {
        const songs = [{ uid: 's1', title: 'Only song', uniqueChords: [] }];
        const mapped = mapSongsWithRelations(songs as any, [] as Relation[]);
        expect(mapped[0].order).toBeNull();
        expect(mapped[0].author_uid).toBeUndefined();
    });

    it('sorts by order when both songs have order', () => {
        const sorted = sortSongsByRelationOrder([
            { uid: 's1', order: 3, title: 'C', uniqueChords: [] },
            { uid: 's2', order: 1, title: 'A', uniqueChords: [] },
            { uid: 's3', order: 2, title: 'B', uniqueChords: [] },
        ]);

        expect(sorted.map((s) => s.uid)).toEqual(['s2', 's3', 's1']);
    });

    it('sorts by title when both songs have null order', () => {
        const sorted = sortSongsByRelationOrder([
            { uid: 's1', order: null, title: 'B', uniqueChords: [] },
            { uid: 's2', order: null, title: 'A', uniqueChords: [] },
        ]);

        expect(sorted.map((s) => s.uid)).toEqual(['s2', 's1']);
    });

    it('sorts by title fallback when one title is missing and orders are null', () => {
        const sorted = sortSongsByRelationOrder([
            { uid: 's1', order: null, uniqueChords: [] },
            { uid: 's2', order: null, title: 'A', uniqueChords: [] },
        ]);

        expect(sorted.map((s) => s.uid)).toEqual(['s1', 's2']);
    });

    it('sorts by title fallback when second title is missing and orders are null', () => {
        const sorted = sortSongsByRelationOrder([
            { uid: 's1', order: null, title: 'A', uniqueChords: [] },
            { uid: 's2', order: null, uniqueChords: [] },
        ]);

        expect(sorted.map((s) => s.uid)).toEqual(['s2', 's1']);
    });

    it('places songs with order before songs without order', () => {
        const sorted = sortSongsByRelationOrder([
            { uid: 's1', order: null, title: 'B', uniqueChords: [] },
            { uid: 's2', order: 1, title: 'A', uniqueChords: [] },
        ]);

        expect(sorted.map((s) => s.uid)).toEqual(['s2', 's1']);
    });

    it('keeps songs with defined order before songs with undefined order', () => {
        const sorted = sortSongsByRelationOrder([
            { uid: 's1', order: 1, title: 'A', uniqueChords: [] },
            { uid: 's2', title: 'B', uniqueChords: [] },
        ]);

        expect(sorted.map((s) => s.uid)).toEqual(['s1', 's2']);
    });
});
