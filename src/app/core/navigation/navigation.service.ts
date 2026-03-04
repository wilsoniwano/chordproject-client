import { inject, Injectable } from '@angular/core';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { TranslocoService } from '@jsverse/transloco';
import { combineLatest, forkJoin, Observable, of, ReplaySubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SongbookService } from '../firebase/api/songbook.service';
import { UserService } from '../user/user.service';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private _navigation: ReplaySubject<FuseNavigationItem[]> =
        new ReplaySubject<FuseNavigationItem[]>(1);
    private _userService = inject(UserService);
    private _songbookService = inject(SongbookService);
    private _translocoService = inject(TranslocoService);

    private get baseNavigation(): FuseNavigationItem[] {
        return [
            {
                id: 'home',
                title: this._translocoService.translate('nav.home'),
                tooltip: this._translocoService.translate('nav.home'),
                type: 'basic',
                icon: 'heroicons_outline:home',
                link: '/home',
            },
            {
                id: 'library',
                title: this._translocoService.translate('nav.library'),
                tooltip: this._translocoService.translate('nav.library'),
                type: 'basic',
                icon: 'heroicons_outline:musical-note',
                link: '/library',
            },
            {
                id: 'create',
                title: this._translocoService.translate('nav.create'),
                tooltip: this._translocoService.translate('nav.create'),
                type: 'basic',
                icon: 'heroicons_outline:code-bracket',
                link: '/songs/create',
            },
        ];
    }

    private get authenticatedSongbooks(): FuseNavigationItem {
        return {
            id: 'songbooks',
            title: this._translocoService.translate('nav.songbooks'),
            tooltip: this._translocoService.translate('nav.songbooks'),
            type: 'aside',
            icon: 'heroicons_outline:book-open',
            children: [],
        };
    }

    private get unauthenticatedSongbooks(): FuseNavigationItem {
        return {
            id: 'songbooks-signin',
            title: this._translocoService.translate('nav.songbooks'),
            tooltip: this._translocoService.translate('nav.songbooks'),
            type: 'basic',
            icon: 'heroicons_outline:book-open',
            link: '/sign-in',
        };
    }

    constructor() {
        combineLatest([
            this._userService.isAuthenticated(),
            this._translocoService.langChanges$,
        ])
            .pipe(
                switchMap(([isAuthenticated]) =>
                    isAuthenticated
                        ? this.buildSongbooksNavigation()
                        : this.buildBasicNavigation()
                )
            )
            .subscribe((navigation) => this._navigation.next(navigation));
    }

    private buildBasicNavigation(): Observable<FuseNavigationItem[]> {
        return of([...this.baseNavigation, this.unauthenticatedSongbooks]);
    }

    private buildSongbooksNavigation(): Observable<FuseNavigationItem[]> {
        return this._songbookService.getByParent('').pipe(
            switchMap((rootSongbooks) => {
                const childrenQueries = rootSongbooks.map((songbook) =>
                    this._songbookService.getByParent(songbook.uid).pipe(
                        map(
                            (childSongbooks) =>
                                ({
                                    id: `songbook-${songbook.uid}`,
                                    title: songbook.name,
                                    type: 'collapsable' as const,
                                    children: childSongbooks.map((child) => ({
                                        id: `songbook-${child.uid}`,
                                        title: child.name,
                                        type: 'basic' as const,
                                        link: `/songbook/${child.uid}`,
                                    })),
                                }) as FuseNavigationItem
                        )
                    )
                );

                return forkJoin(childrenQueries);
            }),
            map((songbookItems) => [
                ...this.baseNavigation,
                {
                    ...this.authenticatedSongbooks,
                    children: songbookItems,
                },
            ])
        );
    }

    get navigation$(): Observable<FuseNavigationItem[]> {
        return this._navigation.asObservable();
    }

    get(): Observable<FuseNavigationItem[]> {
        return this._navigation.asObservable();
    }
}
