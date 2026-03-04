import { describe, expect, it } from 'vitest';
import { diffKeySets, diffLocaleKeys, flattenObjectKeys, getI18nLeafKeys } from './i18n-keys.contract';

describe('i18n keys contract', () => {
    it('has non-empty keyset for base locale', () => {
        const keys = getI18nLeafKeys('pt-br');
        expect(keys.length).toBeGreaterThan(0);
    });

    it('keeps en/es/fr aligned with pt-br keys', () => {
        const locales = ['en', 'es', 'fr'];

        for (const locale of locales) {
            const diff = diffLocaleKeys('pt-br', locale);
            expect(diff.missing, `${locale} missing keys`).toEqual([]);
            expect(diff.extra, `${locale} extra keys`).toEqual([]);
        }
    });

    it('flattens nested keys including empty-object leafs', () => {
        const keys = flattenObjectKeys({
            a: {
                b: 'value',
                c: {},
            },
        });

        expect(keys.sort()).toEqual(['a.b', 'a.c']);
    });

    it('diffs key sets with missing and extra values', () => {
        const diff = diffKeySets(['a', 'b'], ['b', 'c']);
        expect(diff.missing).toEqual(['a']);
        expect(diff.extra).toEqual(['c']);
    });

    it('treats arrays as leaf values in flatten', () => {
        const keys = flattenObjectKeys({ list: ['a', 'b'] });
        expect(keys).toEqual(['list']);
    });

    it('handles null and primitive inputs in flatten', () => {
        expect(flattenObjectKeys(null)).toEqual([]);
        expect(flattenObjectKeys('value', 'root')).toEqual(['root']);
    });
});
