import { PartialSong } from 'app/models/partialsong';
import { Relation } from 'app/models/relation';

export type SongWithRelation = PartialSong & {
    order?: number | null;
    author_uid?: string;
};

export function mapSongsWithRelations(songs: PartialSong[], relations: Relation[]): SongWithRelation[] {
    return songs.map((song) => {
        const relation = relations.find((rel) => rel.songId === song.uid);

        return {
            ...song,
            order: relation?.order ?? null,
            author_uid: relation?.author_uid,
        };
    });
}

export function sortSongsByRelationOrder(songs: SongWithRelation[]): SongWithRelation[] {
    return [...songs].sort((a, b) => {
        if (a.order !== null && a.order !== undefined && b.order !== null && b.order !== undefined) {
            return a.order - b.order;
        }

        if ((a.order === null || a.order === undefined) && (b.order === null || b.order === undefined)) {
            return (a.title || '').localeCompare(b.title || '');
        }

        return a.order === null || a.order === undefined ? 1 : -1;
    });
}

