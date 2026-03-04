import { PartialSong } from 'app/models/partialsong';
import { Songbook } from 'app/models/songbook';
import { limitItems } from 'domain/search/search-index';

export interface SongbookSongsGroup {
    songbook: Songbook;
    songs: PartialSong[];
}

export function mergeUniqueSongMatchesByUid(
    titleMatches: PartialSong[],
    lyricsMatches: PartialSong[]
): PartialSong[] {
    const merged = [...titleMatches, ...lyricsMatches];
    return merged.filter((song, index) => merged.findIndex((item) => item.uid === song.uid) === index);
}

export function limitSongbookSongsGroup(
    group: SongbookSongsGroup,
    limitSongsPerSongbook: number
): SongbookSongsGroup {
    return {
        songbook: group.songbook,
        songs: limitItems(group.songs, limitSongsPerSongbook),
    };
}

export function finalizeSongbookSearchGroups(
    groups: SongbookSongsGroup[],
    limitSongbooks: number
): SongbookSongsGroup[] {
    return groups.filter((item) => item.songs.length > 0).slice(0, limitSongbooks);
}

