import { describe, expect, it } from 'vitest';
import { shouldCloseSearch, shouldCloseSearchOnEscape, shouldOpenSearch } from './search-ui.usecase';

describe('search ui use case', () => {
    it('closes on Escape only for bar appearance when autocomplete is closed', () => {
        expect(shouldCloseSearchOnEscape('bar', false)).toBe(true);
        expect(shouldCloseSearchOnEscape('bar', true)).toBe(false);
        expect(shouldCloseSearchOnEscape('basic', false)).toBe(false);
    });

    it('opens only when currently closed', () => {
        expect(shouldOpenSearch(false)).toBe(true);
        expect(shouldOpenSearch(true)).toBe(false);
    });

    it('closes only when currently opened', () => {
        expect(shouldCloseSearch(true)).toBe(true);
        expect(shouldCloseSearch(false)).toBe(false);
    });
});

