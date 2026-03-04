import { describe, expect, it } from 'vitest';
import {
    buildAuthenticatedSongbooks,
    buildBaseNavigation,
    buildUnauthenticatedSongbooks,
    type NavigationLabels,
} from './navigation.usecase';

const labels: NavigationLabels = {
    library: 'Biblioteca',
    songbooks: 'Listas de reprodução',
};

describe('navigation use case', () => {
    it('builds base navigation with localized labels', () => {
        const nav = buildBaseNavigation(labels);
        expect(nav).toHaveLength(1);
        expect(nav[0].title).toBe('Biblioteca');
    });

    it('builds unauthenticated songbooks item', () => {
        const item = buildUnauthenticatedSongbooks(labels);
        expect(item.id).toBe('songbooks-signin');
        expect(item.link).toBe('/songbook');
        expect(item.title).toBe('Listas de reprodução');
    });

    it('builds authenticated songbooks item as direct link', () => {
        const item = buildAuthenticatedSongbooks(labels);

        expect(item.id).toBe('songbooks');
        expect(item.type).toBe('basic');
        expect(item.link).toBe('/songbook');
    });
});
