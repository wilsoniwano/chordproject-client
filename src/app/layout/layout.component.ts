
import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewEncapsulation,
  DOCUMENT
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { FuseConfig, FuseConfigService } from '@fuse/services/config';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FusePlatformService } from '@fuse/services/platform';
import { FUSE_VERSION } from '@fuse/version';
import { Subject, combineLatest, filter, map, takeUntil } from 'rxjs';
import { ThinLayoutComponent } from './layouts/vertical/thin/thin.component';

@Component({
    selector: 'layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [
        ThinLayoutComponent,
    ],
})
export class LayoutComponent implements OnInit, OnDestroy {
    config: FuseConfig;
    scheme: 'dark' | 'light';
    theme: string;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    private readonly _schemeStorageKey = 'chp.scheme';
    private readonly _themeStorageKey = 'chp.theme';

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        @Inject(DOCUMENT) private _document: any,
        private _renderer2: Renderer2,
        private _router: Router,
        private _fuseConfigService: FuseConfigService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fusePlatformService: FusePlatformService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this._restorePersistedThemeConfig();

        // Set the theme and scheme based on the configuration
        combineLatest([
            this._fuseConfigService.config$,
            this._fuseMediaWatcherService.onMediaQueryChange$([
                '(prefers-color-scheme: dark)',
                '(prefers-color-scheme: light)',
            ]),
        ])
            .pipe(
                takeUntil(this._unsubscribeAll),
                map(([config, mql]) => {
                    const options = {
                        configuredScheme: config.scheme,
                        scheme: config.scheme,
                        theme: config.theme,
                        config,
                    };

                    // If the scheme is set to 'auto'...
                    if (config.scheme === 'auto') {
                        // Decide the scheme using the media query
                        options.scheme = mql.breakpoints[
                            '(prefers-color-scheme: dark)'
                        ]
                            ? 'dark'
                            : 'light';
                    }

                    return options;
                })
            )
            .subscribe((options) => {
                this.config = options.config;

                // Store the options
                this.scheme = options.scheme;
                this.theme = options.theme;
                this._persistThemeConfig(configurePersistedScheme(options.configuredScheme), options.theme);

                // Update the scheme and theme
                this._updateScheme();
                this._updateTheme();
            });

        // Subscribe to NavigationEnd event
        this._router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe(() => {
                // Update the layout
                this._updateLayout();
            });

        // Set the app version
        this._renderer2.setAttribute(
            this._document.querySelector('[ng-version]'),
            'fuse-version',
            FUSE_VERSION
        );

        // Set the OS name
        this._renderer2.addClass(
            this._document.body,
            this._fusePlatformService.osName
        );
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Update the selected layout
     */
    private _updateLayout(): void {
        // Get the current activated route
        let route = this._activatedRoute;
        while (route.firstChild) {
            route = route.firstChild;
        }
    }

    /**
     * Update the selected scheme
     *
     * @private
     */
    private _updateScheme(): void {
        // Remove class names for all schemes
        this._document.body.classList.remove('light', 'dark');

        // Add class name for the currently selected scheme
        this._document.body.classList.add(this.scheme);
    }

    /**
     * Update the selected theme
     *
     * @private
     */
    private _updateTheme(): void {
        // Find the class name for the previously selected theme and remove it
        this._document.body.classList.forEach((className: string) => {
            if (className.startsWith('theme-')) {
                this._document.body.classList.remove(
                    className,
                    className.split('-')[1]
                );
            }
        });

        // Add class name for the currently selected theme
        this._document.body.classList.add(this.theme);
    }

    private _restorePersistedThemeConfig(): void {
        const storage = this._document?.defaultView?.localStorage;
        if (!storage) {
            return;
        }

        const scheme = storage.getItem(this._schemeStorageKey);
        const theme = storage.getItem(this._themeStorageKey);
        const schemeValue = configurePersistedScheme(scheme);

        const configPatch: Partial<FuseConfig> = {};
        if (schemeValue) {
            configPatch.scheme = schemeValue;
        }
        if (theme) {
            configPatch.theme = theme;
        }

        if (Object.keys(configPatch).length > 0) {
            this._fuseConfigService.config = configPatch;
        }
    }

    private _persistThemeConfig(scheme: 'auto' | 'dark' | 'light' | null, theme: string | null): void {
        const storage = this._document?.defaultView?.localStorage;
        if (!storage) {
            return;
        }

        if (scheme) {
            storage.setItem(this._schemeStorageKey, scheme);
        }

        if (theme) {
            storage.setItem(this._themeStorageKey, theme);
        }
    }
}

function configurePersistedScheme(value: string | null): 'auto' | 'dark' | 'light' | null {
    if (value === 'auto' || value === 'dark' || value === 'light') {
        return value;
    }

    return null;
}
