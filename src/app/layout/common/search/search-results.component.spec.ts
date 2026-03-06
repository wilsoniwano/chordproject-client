import { describe, expect, it } from 'vitest';
import { SearchResultsComponent } from './search-results.component';

describe('SearchResultsComponent', () => {
    const component = new SearchResultsComponent();

    it('builds metadata line with artist, key and tempo', () => {
        const line = component.getSongMetaLine({
            artists: ['CifraPro Band'],
            songKey: 'G',
            tempo: 92,
        });

        expect(line).toBe('CifraPro Band • Tom: G • Tempo: 92');
    });

    it('prefers custom key over original key', () => {
        const line = component.getSongMetaLine({
            artists: ['CifraPro Band'],
            songKey: 'G',
            customKey: 'Ab',
        });

        expect(line).toContain('Tom: Ab');
    });

    it('returns empty metadata line for empty song payload', () => {
        expect(component.getSongMetaLine(null)).toBe('');
    });
});
