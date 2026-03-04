import { inject, Injectable } from '@angular/core';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { TranslocoService } from '@jsverse/transloco';
import {
    buildAuthenticatedSongbooks,
    buildBaseNavigation,
    buildUnauthenticatedSongbooks,
    NavigationLabels,
} from 'application/navigation/navigation.usecase';
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

    private get labels(): NavigationLabels {
        return {
            library: this._translocoService.translate('nav.library'),
            create: this._translocoService.translate('nav.create'),
            songbooks: this._translocoService.translate('nav.songbooks'),
        };
    }

    private get baseNavigation(): FuseNavigationItem[] {
        return buildBaseNavigation(this.labels);
    }

    private get unauthenticatedSongbooks(): FuseNavigationItem {
        return buildUnauthenticatedSongbooks(this.labels);
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
                        map((childSongbooks) => {
                            if (!childSongbooks.length) {
                                return {
                                    id: `songbook-${songbook.uid}`,
                                    title: songbook.name,
                                    type: 'basic' as const,
                                    link: `/songbook/${songbook.uid}`,
                                } as FuseNavigationItem;
                            }

                            return {
                                id: `songbook-${songbook.uid}`,
                                title: songbook.name,
                                type: 'collapsable' as const,
                                children: childSongbooks.map((child) => ({
                                    id: `songbook-${child.uid}`,
                                    title: child.name,
                                    type: 'basic' as const,
                                    link: `/songbook/${child.uid}`,
                                })),
                            } as FuseNavigationItem;
                        })
                    )
                );

            return forkJoin(childrenQueries);
            }),
            map((songbookItems) => {
                const listSongbooksItem: FuseNavigationItem = {
                    id: 'songbook-list',
                    title: this._translocoService.translate('nav.songbooks'),
                    type: 'basic',
                    icon: 'heroicons_outline:list-bullet',
                    link: '/songbook',
                };

                const createSongbookItem: FuseNavigationItem = {
                    id: 'songbook-create',
                    title: this._translocoService.translate('nav.create_songbook'),
                    type: 'basic',
                    icon: 'heroicons_outline:plus',
                    link: '/songbook/create',
                };

                return [
                    ...this.baseNavigation,
                    buildAuthenticatedSongbooks(this.labels, [listSongbooksItem, createSongbookItem, ...songbookItems]),
                ];
            })
        );
    }

    get navigation$(): Observable<FuseNavigationItem[]> {
        return this._navigation.asObservable();
    }

    get(): Observable<FuseNavigationItem[]> {
        return this._navigation.asObservable();
    }
}
