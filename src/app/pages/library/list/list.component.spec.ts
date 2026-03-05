// @vitest-environment jsdom
import '@angular/compiler';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { SongService } from 'app/core/firebase/api/song.service';
import { PartialSong } from 'app/models/partialsong';
import { LibraryComponent } from '../library.component';
import { SongsListComponent } from './list.component';

describe('SongsListComponent', () => {
    const createComponent = (drawerOpened = false) => {
        const changeDetectorRef = {
            markForCheck: vi.fn(),
        } as unknown as ChangeDetectorRef;

        const songService = {} as SongService;
        const navigateByUrl = vi.fn();
        const router = {
            navigateByUrl,
        } as unknown as Router;

        const open = vi.fn();
        const libraryComponent = {
            matDrawer: {
                opened: drawerOpened,
                open,
            },
        } as unknown as LibraryComponent;

        const component = new SongsListComponent(changeDetectorRef, songService, router, libraryComponent);

        return { component, open, navigateByUrl, libraryComponent };
    };

    const song = (uid: string): PartialSong =>
        ({
            uid,
            title: `song-${uid}`,
        }) as PartialSong;

    it('does not navigate when clicking selected song while drawer is open', () => {
        const { component, open, navigateByUrl } = createComponent(true);
        component.selectedSong = song('a');

        component.onSongClick(song('a'));

        expect(open).not.toHaveBeenCalled();
        expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('navigates without reopening when drawer is already open', () => {
        const { component, open, navigateByUrl } = createComponent(true);
        component.selectedSong = song('a');

        component.onSongClick(song('b'));

        expect(open).not.toHaveBeenCalled();
        expect(navigateByUrl).toHaveBeenCalledWith('/library/(drawer:b)');
    });

    it('opens drawer before navigation when drawer is closed', () => {
        const { component, open, navigateByUrl } = createComponent(false);

        component.onSongClick(song('c'));

        expect(open).toHaveBeenCalledOnce();
        expect(navigateByUrl).toHaveBeenCalledWith('/library/(drawer:c)');
    });
});
