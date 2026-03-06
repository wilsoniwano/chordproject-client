// @vitest-environment jsdom
import '@angular/compiler';
import { Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThinLayoutComponent } from './thin.component';
import { SettingsComponent } from 'app/layout/common/settings/settings.component';

describe('ThinLayoutComponent', () => {
    let routerEvents$: Subject<any>;

    function buildActivatedRoute(data: Record<string, any>) {
        return {
            snapshot: { data: {} },
            firstChild: {
                snapshot: { data },
                firstChild: null,
            },
        } as any;
    }

    beforeEach(() => {
        routerEvents$ = new Subject<any>();
    });

    function createComponentWithDialog(dialogOpen: ReturnType<typeof vi.fn>) {
        return new ThinLayoutComponent(
            { navigation$: of([]) } as any,
            { onMediaChange$: of({ matchingAliases: ['md'] }) } as any,
            { getComponent: () => null } as any,
            { events: routerEvents$ } as any,
            buildActivatedRoute({}) as any,
            { open: dialogOpen } as any
        );
    }

    it('hides only navigation drawer when route has hideNavigationDrawer', () => {
        const component = new ThinLayoutComponent(
            { navigation$: of([]) } as any,
            { onMediaChange$: of({ matchingAliases: ['md'] }) } as any,
            { getComponent: () => null } as any,
            { events: routerEvents$ } as any,
            buildActivatedRoute({ hideNavigationDrawer: true }) as any,
            { open: () => null } as any
        );

        component.ngOnInit();

        expect(component.hideNavigationDrawer).toBe(true);
        expect(component.hideLayoutChrome).toBe(false);
    });

    it('hides full chrome when route has hideLayoutChrome', () => {
        const component = new ThinLayoutComponent(
            { navigation$: of([]) } as any,
            { onMediaChange$: of({ matchingAliases: ['md'] }) } as any,
            { getComponent: () => null } as any,
            { events: routerEvents$ } as any,
            buildActivatedRoute({ hideLayoutChrome: true }) as any,
            { open: () => null } as any
        );

        component.ngOnInit();

        expect(component.hideLayoutChrome).toBe(true);
    });

    it('opens settings as dialog and closes when asked by settings component', () => {
        const closeSettings$ = new Subject<void>();
        const afterClosed$ = new Subject<void>();
        const dialogRef = {
            close: vi.fn(),
            afterClosed: () => afterClosed$,
            componentInstance: {
                closeSettings: closeSettings$,
            },
        };
        const open = vi.fn().mockReturnValue(dialogRef);
        const component = createComponentWithDialog(open);

        component.toggleSettingsDrawer();

        expect(open).toHaveBeenCalledWith(
            SettingsComponent,
            expect.objectContaining({
                width: '420px',
                panelClass: 'settings-modal-panel',
            })
        );

        closeSettings$.next();
        expect(dialogRef.close).toHaveBeenCalledTimes(1);
    });

    it('toggles settings dialog off when already opened', () => {
        const closeSettings$ = new Subject<void>();
        const afterClosed$ = new Subject<void>();
        const dialogRef = {
            close: vi.fn(),
            afterClosed: () => afterClosed$,
            componentInstance: {
                closeSettings: closeSettings$,
            },
        };
        const open = vi.fn().mockReturnValue(dialogRef);
        const component = createComponentWithDialog(open);

        component.toggleSettingsDrawer();
        component.toggleSettingsDrawer();

        expect(open).toHaveBeenCalledTimes(1);
        expect(dialogRef.close).toHaveBeenCalledTimes(1);
    });
});
