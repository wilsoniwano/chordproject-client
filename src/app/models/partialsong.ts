export class PartialSong {
    uid: string;
    artists?: string[];
    lyrics?: string;
    title?: string;
    content?: string;
    songKey?: string;
    customKey?: string | null;
    uniqueChords: string[];
}
