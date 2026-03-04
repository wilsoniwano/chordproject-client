import { inject, Injectable } from '@angular/core';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { TranslocoService } from '@jsverse/transloco';
import {
    buildAuthenticatedSongbooks,
    buildBaseNavigation,
    buildUnauthenticatedSongbooks,
    NavigationLabels,
} from 'application/navigation/navigation.usecase';
import { combineLatest, Observable, of, ReplaySubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { UserService } from '../user/user.service';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private _navigation: ReplaySubject<FuseNavigationItem[]> =
        new ReplaySubject<FuseNavigationItem[]>(1);
    private _userService = inject(UserService);
    private _translocoService = inject(TranslocoService);

    private get labels(): NavigationLabels {
        return {
            library: this._translocoService.translate('nav.library'),
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
        return of([this.unauthenticatedSongbooks, ...this.baseNavigation]);
    }

    private buildSongbooksNavigation(): Observable<FuseNavigationItem[]> {
        return of([buildAuthenticatedSongbooks(this.labels), ...this.baseNavigation]);
    }

    get navigation$(): Observable<FuseNavigationItem[]> {
        return this._navigation.asObservable();
    }

    get(): Observable<FuseNavigationItem[]> {
        return this._navigation.asObservable();
    }
}
