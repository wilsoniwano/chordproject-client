import { PartialSong } from './partialsong';
import { Songbook } from './songbook';

export interface SearchResultSets {
    songs: PartialSong[];
    songsContent?: PartialSong[];
    songbooks: Songbook[];
    songsInSongbooks: { songbook: Songbook; songs: PartialSong[] }[];
}
