import { describe, expect, it } from 'vitest';
import { getAvailableMusicalKeys, normalizeMusicalKey, transposeMusicalKey } from './transpose-key';

describe('transpose-key domain', () => {
    it('normalizes valid keys and keeps minor flag', () => {
        expect(normalizeMusicalKey('C#m')).toBe('C#m');
        expect(normalizeMusicalKey('Eb')).toBe('Eb');
    });

    it('transposes upward and downward', () => {
        expect(transposeMusicalKey('C', 1)).toBe('C#');
        expect(transposeMusicalKey('C', -1)).toBe('B');
        expect(transposeMusicalKey('Am', 2)).toBe('Bm');
    });

    it('returns original when key is unknown', () => {
        expect(transposeMusicalKey('H', 1)).toBe('H');
    });

    it('handles empty input and octave movement', () => {
        expect(normalizeMusicalKey('')).toBe('');
        expect(transposeMusicalKey('C', 12)).toBe('C');
        expect(transposeMusicalKey('F#m', -12)).toBe('F#m');
    });

    it('returns all available keys preserving major/minor mode', () => {
        const majorKeys = getAvailableMusicalKeys('G');
        const minorKeys = getAvailableMusicalKeys('Em');

        expect(majorKeys).toHaveLength(12);
        expect(majorKeys[0]).toBe('C');
        expect(minorKeys).toHaveLength(12);
        expect(minorKeys[0]).toBe('Cm');
    });
});
