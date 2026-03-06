import { FuseNavigationItem } from '@fuse/components/navigation';

export interface NavigationLabels {
    library: string;
    songbooks: string;
    settingsLeaders: string;
}

export function buildBaseNavigation(labels: NavigationLabels): FuseNavigationItem[] {
    return [
        {
            id: 'library',
            title: labels.library,
            type: 'basic',
            icon: 'heroicons_outline:musical-note',
            link: '/library',
        },
        {
            id: 'settings-leaders',
            title: labels.settingsLeaders,
            type: 'basic',
            icon: 'heroicons_outline:cog-6-tooth',
            link: '/settings/leaders',
        },
    ];
}

export function buildUnauthenticatedSongbooks(labels: NavigationLabels): FuseNavigationItem {
    return {
        id: 'songbooks-signin',
        title: labels.songbooks,
        type: 'basic',
        icon: 'heroicons_outline:book-open',
        link: '/songbook',
    };
}

export function buildAuthenticatedSongbooks(labels: NavigationLabels): FuseNavigationItem {
    return {
        id: 'songbooks',
        title: labels.songbooks,
        type: 'basic',
        icon: 'heroicons_outline:book-open',
        link: '/songbook',
    };
}
