// @vitest-environment jsdom
import '@angular/compiler';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChpViewerComponent } from './viewer.component';

describe('ChpViewerComponent', () => {
    let component: ChpViewerComponent;
    let host: HTMLDivElement;
    let content: HTMLDivElement;
    let contentInner: HTMLDivElement;

    beforeEach(() => {
        const parserService = {
            parseSong: vi.fn(),
            formatToHtml: vi.fn().mockReturnValue('<div class="song-content">abc</div>'),
            transposeSong: vi.fn(),
        };
        const viewSettingsService = {
            getViewSettings: vi.fn().mockReturnValue(
                of({
                    showChords: true,
                    showTabs: true,
                    showColumns: false,
                    lyricsFontStyle: { isItalic: false, isBold: false, size: 2, color: 'default' },
                    chordsFontStyle: { isItalic: false, isBold: false, size: 2, color: 'default' },
                    commentsFontStyle: { isItalic: false, isBold: false, size: 2, color: 'default' },
                })
            ),
        };

        component = new ChpViewerComponent(parserService as any, viewSettingsService as any);

        host = document.createElement('div');
        content = document.createElement('div');
        content.className = 'content';
        contentInner = document.createElement('div');
        contentInner.className = 'content-inner';
        content.appendChild(contentInner);
        host.appendChild(content);

        Object.defineProperty(host, 'clientWidth', { value: 1000, configurable: true });
        Object.defineProperty(host, 'clientHeight', { value: 800, configurable: true });
        Object.defineProperty(content, 'scrollHeight', { value: 2000, configurable: true });
        Object.defineProperty(content, 'offsetHeight', { value: 2000, configurable: true });
        Object.defineProperty(host, 'scrollWidth', { value: 3000, configurable: true });

        (host as any).scrollBy = vi.fn();
        (host as any).scrollLeft = 1000;

        component.contentElement = host as any;
        component.fontSize = 16;
    });

    it('applies paged mode styles and page metrics', () => {
        component.viewMode = 'paged';
        component.pagedColumnWidth = 320;

        (component as any).applyZoomToSongContent();

        expect(host.style.overflowX).toBe('auto');
        expect(host.style.overflowY).toBe('hidden');
        expect(content.style.columnCount).toBe('3');
        expect(content.style.columnWidth).toBe('320px');
        expect(content.style.width).toContain('px');
    });

    it('goes to next page only in paged mode', () => {
        component.viewMode = 'normal';
        component.goToNextPage();
        expect((host as any).scrollBy).not.toHaveBeenCalled();

        component.viewMode = 'paged';
        component.goToNextPage();
        expect((host as any).scrollBy).toHaveBeenCalledOnce();
    });

    it('emits current and total pages in paged mode', () => {
        const emitSpy = vi.fn();
        component.pageInfoChange.subscribe(emitSpy);
        component.viewMode = 'paged';

        component.onContentScroll();

        expect(emitSpy).toHaveBeenCalled();
        const pageInfo = emitSpy.mock.calls.at(-1)?.[0];
        expect(pageInfo).toEqual({ current: 2, total: 3 });
    });
});
