export class PartialSong {
    uid: string;
    artists?: string[];
    lyrics?: string;
    title?: string;
    content?: string;
    songKey?: string;
    tempo?: number;
    customKey?: string | null;
    uniqueChords: string[];
}
