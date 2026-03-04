// @vitest-environment jsdom
import '@angular/compiler';
import { Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThinLayoutComponent } from './thin.component';

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

    it('hides only navigation drawer when route has hideNavigationDrawer', () => {
        const component = new ThinLayoutComponent(
            { navigation$: of([]) } as any,
            { onMediaChange$: of({ matchingAliases: ['md'] }) } as any,
            { getComponent: () => null } as any,
            { events: routerEvents$ } as any,
            buildActivatedRoute({ hideNavigationDrawer: true }) as any
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
            buildActivatedRoute({ hideLayoutChrome: true }) as any
        );

        component.ngOnInit();

        expect(component.hideLayoutChrome).toBe(true);
    });
});
