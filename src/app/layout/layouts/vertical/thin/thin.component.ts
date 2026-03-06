import {
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import {
    FuseNavigationItem,
    FuseNavigationService,
    FuseVerticalNavigationComponent,
} from '@fuse/components/navigation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { SearchComponent } from 'app/layout/common/search/search.component';
import { SettingsComponent } from 'app/layout/common/settings/settings.component';
import { ThemeSelectorComponent } from 'app/layout/common/theme-selector/theme-selector.component';
import { UserComponent } from 'app/layout/common/user/user.component';
import { Subject, filter, takeUntil } from 'rxjs';

@Component({
    selector: 'thin-layout',
    templateUrl: './thin.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [
        FuseLoadingBarComponent,
        FuseVerticalNavigationComponent,
        MatButtonModule,
        MatIconModule,
        SearchComponent,
        ThemeSelectorComponent,
        UserComponent,
        RouterOutlet,
    ],
})
export class ThinLayoutComponent implements OnInit, OnDestroy {
    isScreenSmall: boolean;
    navigation: FuseNavigationItem[];
    hideLayoutChrome = false;
    hideNavigationDrawer = false;
    private _settingsDialogRef: MatDialogRef<SettingsComponent> | null = null;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _navigationService: NavigationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _matDialog: MatDialog
    ) {}

    get currentYear(): number {
        return new Date().getFullYear();
    }

    ngOnInit(): void {
        this._navigationService.navigation$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((navigation: FuseNavigationItem[]) => {
                this.navigation = navigation;
            });

        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                this.isScreenSmall = !matchingAliases.includes('md');
            });

        this._router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe(() => this.updateLayoutChromeVisibility());

        this.updateLayoutChromeVisibility();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    toggleNavigation(name: string): void {
        const navigation =
            this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(
                name
            );

        if (navigation) {
            navigation.toggle();
        }
    }

    toggleSettingsDrawer(): void {
        if (this._settingsDialogRef) {
            this._settingsDialogRef.close();
            return;
        }

        this._settingsDialogRef = this._matDialog.open(SettingsComponent, {
            width: '420px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            autoFocus: false,
            panelClass: 'settings-modal-panel',
        });

        this._settingsDialogRef.componentInstance.closeSettings
            .pipe(takeUntil(this._settingsDialogRef.afterClosed()))
            .subscribe(() => this._settingsDialogRef?.close());

        this._settingsDialogRef.afterClosed().subscribe(() => {
            this._settingsDialogRef = null;
        });
    }

    closeSettingsDrawer(): void {
        this._settingsDialogRef?.close();
    }

    private updateLayoutChromeVisibility(): void {
        let route = this._activatedRoute;

        while (route.firstChild) {
            route = route.firstChild;
        }

        this.hideLayoutChrome = !!route.snapshot.data['hideLayoutChrome'];
        this.hideNavigationDrawer = !!route.snapshot.data['hideNavigationDrawer'];
    }
}
