// @vitest-environment jsdom
import '@angular/compiler';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SongbookViewerComponent } from './songbook-viewer.component';

describe('SongbookViewerComponent', () => {
    let component: SongbookViewerComponent;

    beforeEach(() => {
        const route = { paramMap: of(new Map()), queryParamMap: of(new Map()) };
        const router = { navigate: vi.fn().mockResolvedValue(true) };
        const dialog = { open: vi.fn() };
        const songbookService = {
            get: vi.fn().mockReturnValue(of(null)),
            getContent: vi.fn().mockReturnValue(of([])),
        };
        const parserService = {
            parseSong: vi.fn(),
            transposeSong: vi.fn(),
            formatToChordPro: vi.fn(),
        };
        const userService = { user$: of(null) };

        component = new SongbookViewerComponent(
            route as any,
            router as any,
            dialog as any,
            songbookService as any,
            parserService as any,
            userService as any
        );

        component.songbookId = 'sb-1';
        (component as any).songbookViewer = { resetHorizontalPage: vi.fn() };
    });

    it('switches view mode and persists it', () => {
        const setSpy = vi.spyOn(Storage.prototype, 'setItem');

        component.setViewMode('normal');

        expect(component.viewMode).toBe('normal');
        expect((component as any).songbookViewer.resetHorizontalPage).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalledWith('chp.songbook.viewer.mode.anonymous.sb-1', 'normal');
    });

    it('clamps columns per page and persists', () => {
        const setSpy = vi.spyOn(Storage.prototype, 'setItem');

        component.setColumnsPerPage(2);
        expect(component.columnsPerPage).toBe(2);

        component.setColumnsPerPage(99 as any);
        expect(component.columnsPerPage).toBe(1);
        expect(setSpy).toHaveBeenCalledWith('chp.songbook.viewer.columnsPerPage.anonymous.sb-1', '1');
    });

    it('falls back to paged mode when saved mode is invalid', () => {
        window.localStorage.setItem('chp.songbook.viewer.mode.anonymous.sb-1', 'vertical-pages');

        (component as any).loadViewMode();

        expect(component.viewMode).toBe('paged');
    });

});
