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
    let songContent: HTMLDivElement;

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
        songContent = document.createElement('div');
        songContent.className = 'song-content';
        contentInner.appendChild(songContent);
        content.appendChild(contentInner);
        host.appendChild(content);

        Object.defineProperty(host, 'clientWidth', { value: 1000, configurable: true });
        Object.defineProperty(host, 'clientHeight', { value: 800, configurable: true });
        Object.defineProperty(contentInner, 'scrollHeight', { value: 2000, configurable: true });
        Object.defineProperty(contentInner, 'offsetHeight', { value: 2000, configurable: true });
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
        expect(contentInner.style.columnCount).toBe('3');
        expect(contentInner.style.columnWidth).toBe('320px');
        expect(contentInner.style.width).toContain('px');
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

    it('normalizes metadata order to title, artist, album, key, tempo, time', () => {
        const input = `
            <div class="song-metadata">
                <div class="metadata tempo-metadata">Tempo: 92</div>
                <h1 class="metadata title-metadata">Title</h1>
                <div class="metadata time-metadata">Time: 4/4</div>
                <div class="metadata album-metadata">Album: A</div>
                <h3 class="metadata artist-metadata">Artist</h3>
                <div class="metadata key-metadata">Key: G</div>
            </div>
        `;

        const output = (component as any).normalizeMetadataOrder(input);
        const titleIdx = output.indexOf('title-metadata');
        const artistIdx = output.indexOf('artist-metadata');
        const albumIdx = output.indexOf('album-metadata');
        const keyIdx = output.indexOf('key-metadata');
        const tempoIdx = output.indexOf('tempo-metadata');
        const timeIdx = output.indexOf('time-metadata');

        expect(titleIdx).toBeGreaterThan(-1);
        expect(artistIdx).toBeGreaterThan(titleIdx);
        expect(albumIdx).toBeGreaterThan(artistIdx);
        expect(keyIdx).toBeGreaterThan(albumIdx);
        expect(tempoIdx).toBeGreaterThan(keyIdx);
        expect(timeIdx).toBeGreaterThan(tempoIdx);
    });
});
