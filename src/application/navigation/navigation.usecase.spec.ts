import { describe, expect, it } from 'vitest';
import {
    buildAuthenticatedSongbooks,
    buildBaseNavigation,
    buildUnauthenticatedSongbooks,
    type NavigationLabels,
} from './navigation.usecase';

const labels: NavigationLabels = {
    home: 'Início',
    library: 'Biblioteca',
    create: 'Criar',
    songbooks: 'Listas de reprodução',
};

describe('navigation use case', () => {
    it('builds base navigation with localized labels', () => {
        const nav = buildBaseNavigation(labels);
        expect(nav).toHaveLength(3);
        expect(nav[0].title).toBe('Início');
        expect(nav[1].title).toBe('Biblioteca');
        expect(nav[2].title).toBe('Criar');
    });

    it('builds unauthenticated songbooks item', () => {
        const item = buildUnauthenticatedSongbooks(labels);
        expect(item.id).toBe('songbooks-signin');
        expect(item.link).toBe('/sign-in');
        expect(item.title).toBe('Listas de reprodução');
    });

    it('builds authenticated songbooks item with children', () => {
        const children = [{ id: 'songbook-1', title: 'Louvor', type: 'basic', link: '/songbook/1' }] as any;
        const item = buildAuthenticatedSongbooks(labels, children);

        expect(item.id).toBe('songbooks');
        expect(item.type).toBe('aside');
        expect(item.children).toHaveLength(1);
        expect(item.children?.[0].title).toBe('Louvor');
    });
});

