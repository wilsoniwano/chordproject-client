import { FuseNavigationItem } from '@fuse/components/navigation';

export interface NavigationLabels {
    home: string;
    library: string;
    create: string;
    songbooks: string;
}

export function buildBaseNavigation(labels: NavigationLabels): FuseNavigationItem[] {
    return [
        {
            id: 'home',
            title: labels.home,
            tooltip: labels.home,
            type: 'basic',
            icon: 'heroicons_outline:home',
            link: '/home',
        },
        {
            id: 'library',
            title: labels.library,
            tooltip: labels.library,
            type: 'basic',
            icon: 'heroicons_outline:musical-note',
            link: '/library',
        },
        {
            id: 'create',
            title: labels.create,
            tooltip: labels.create,
            type: 'basic',
            icon: 'heroicons_outline:code-bracket',
            link: '/songs/create',
        },
    ];
}

export function buildUnauthenticatedSongbooks(labels: NavigationLabels): FuseNavigationItem {
    return {
        id: 'songbooks-signin',
        title: labels.songbooks,
        tooltip: labels.songbooks,
        type: 'basic',
        icon: 'heroicons_outline:book-open',
        link: '/sign-in',
    };
}

export function buildAuthenticatedSongbooks(
    labels: NavigationLabels,
    children: FuseNavigationItem[]
): FuseNavigationItem {
    return {
        id: 'songbooks',
        title: labels.songbooks,
        tooltip: labels.songbooks,
        type: 'aside',
        icon: 'heroicons_outline:book-open',
        children,
    };
}

