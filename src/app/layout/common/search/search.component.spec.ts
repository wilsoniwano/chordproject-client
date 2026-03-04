import '@angular/compiler';
import { ElementRef } from '@angular/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchComponent } from './search.component';

describe('SearchComponent integration', () => {
    let songService: any;
    let songbookService: any;
    let component: SearchComponent;

    beforeEach(() => {
        songService = {
            searchByTitle: vi.fn().mockReturnValue(of([{ uid: '1', title: 'A', uniqueChords: [] }])),
            searchByLyrics: vi
                .fn()
                .mockReturnValue(of([{ uid: '1', title: 'A', lyrics: 'lyric', uniqueChords: [] }])),
        };
        songbookService = {
            searchSongbooks: vi.fn().mockReturnValue(of([])),
            searchSongsInSongbooks: vi.fn().mockReturnValue(of([])),
        };

        component = new SearchComponent(
            songService,
            songbookService,
            new ElementRef({ contains: () => true })
        );
        component.debounce = 300;
        component.minLength = 2;
        component.searchResults = { matAutocomplete: { isOpen: false } } as any;
        component.ngOnInit();
    });

    it('does not search when below minLength and resets results', () => {
        vi.useFakeTimers();
        component.resultSets = { songs: [], songbooks: [], songsInSongbooks: [] };

        component.searchControl.setValue('a');
        vi.advanceTimersByTime(350);

        expect(songService.searchByTitle).not.toHaveBeenCalled();
        expect(component.resultSets).toBeNull();
        vi.useRealTimers();
    });

    it('searches after debounce and emits deduplicated results', () => {
        vi.useFakeTimers();
        const emitSpy = vi.fn();
        component.search.subscribe(emitSpy);

        component.searchControl.setValue('ab');
        vi.advanceTimersByTime(350);

        expect(songService.searchByTitle).toHaveBeenCalledWith('ab', 5);
        expect(songService.searchByLyrics).toHaveBeenCalledWith('ab', 5);
        expect(emitSpy).toHaveBeenCalledTimes(1);

        const emitted = emitSpy.mock.calls[0][0];
        expect(emitted.songs).toHaveLength(1);
        expect(emitted.songsContent).toHaveLength(0);
        vi.useRealTimers();
    });
});
