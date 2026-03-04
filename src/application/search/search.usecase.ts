import { PartialSong } from 'app/models/partialsong';
import { Songbook } from 'app/models/songbook';
import { SearchResultSets } from 'app/models/searchResultSets';

export interface RawSearchResultSets {
    songs: PartialSong[];
    songsContent: PartialSong[];
    songbooks: Songbook[];
    songsInSongbooks: { songbook: Songbook; songs: PartialSong[] }[];
}

export function shouldRunSearch(value: string | null | undefined, minLength: number): boolean {
    return !!value && value.length >= minLength;
}

export function buildSearchResultSets(resultSets: RawSearchResultSets): SearchResultSets {
    const songUids = new Set(resultSets.songs.map((song) => song.uid));
    const songsContent = resultSets.songsContent.filter((song) => !songUids.has(song.uid));

    return {
        songs: resultSets.songs,
        songsContent,
        songbooks: resultSets.songbooks,
        songsInSongbooks: resultSets.songsInSongbooks,
    };
}

