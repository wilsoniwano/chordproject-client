import { describe, expect, it } from 'vitest';
import { normalizeText } from './normalize-text';

describe('normalize-text domain', () => {
    it('removes accents and lowercases', () => {
        expect(normalizeText('Árvore Coração')).toBe('arvore coracao');
    });

    it('handles null and undefined as empty string', () => {
        expect(normalizeText(null)).toBe('');
        expect(normalizeText(undefined)).toBe('');
    });
});

