import { Injectable } from '@angular/core';
import {
    ChordProParser,
    HtmlFormatter,
    MusicNote,
    Song,
    Transposer,
} from 'chordproject-parser';

@Injectable({
    providedIn: 'root',
})
export class ParserService {
    private readonly _enharmonicFallbackMap: Record<string, string> = {
        Ab: 'G#',
        Bb: 'A#',
        Cb: 'B',
        Db: 'C#',
        Eb: 'D#',
        Fb: 'E',
        Gb: 'F#',
    };

    parseSong(content: string): Song {
        return new ChordProParser().parse(content);
    }

    formatToHtml(
        song: Song,
        showMetadata = false,
        showChords = true,
        showTabs = true
    ): string {
        const formatter = new HtmlFormatter();
        formatter.settings.showMetadata = showMetadata;
        formatter.settings.showChords = showChords;
        formatter.settings.showTabs = showTabs;
        return formatter.format(song).join('');
    }

    transposeSong(song: Song, newKey: string): Song {
        const targetNote = this._resolveTargetNote(newKey);

        try {
            return Transposer.transpose(song, targetNote);
        } catch {
            const fallbackNote = this._resolveEnharmonicFallback(newKey);
            if (fallbackNote) {
                return Transposer.transpose(song, fallbackNote);
            }

            return song;
        }
    }

    private _resolveTargetNote(newKey: string): MusicNote {
        const parsed = MusicNote.parse(newKey);
        if (parsed) {
            return parsed;
        }

        const isMinor = newKey?.endsWith('m');
        const root = isMinor ? newKey.slice(0, -1) : newKey;
        const fallbackRoot = this._enharmonicFallbackMap[root];

        if (!fallbackRoot) {
            return MusicNote.parse('C')!;
        }

        const fallbackParsed = MusicNote.parse(fallbackRoot);
        if (fallbackParsed) {
            return fallbackParsed;
        }

        return MusicNote.parse('C')!;
    }

    private _resolveEnharmonicFallback(newKey: string): MusicNote | null {
        const isMinor = newKey?.endsWith('m');
        const root = isMinor ? newKey.slice(0, -1) : newKey;
        const fallbackRoot = this._enharmonicFallbackMap[root];

        if (!fallbackRoot) {
            return null;
        }

        return MusicNote.parse(fallbackRoot);
    }
}
