// @vitest-environment jsdom
import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { ParserService } from './parser.service';

describe('ParserService transpose fallback', () => {
    const service = new ParserService();

    it('transposes without throwing when target key is Ab', () => {
        const song = service.parseSong('{key: A}\n[A]linha [E]teste');

        const transposed = service.transposeSong(song, 'Ab');

        const chords = transposed
            .getAllChords()
            .map((chord) => chord.toString())
            .filter(Boolean);

        expect(chords.length).toBeGreaterThan(0);
    });
});
