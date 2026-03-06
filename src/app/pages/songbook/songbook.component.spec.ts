// @vitest-environment jsdom
import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SongbookComponent } from './songbook.component';

describe('SongbookComponent', () => {
    let component: SongbookComponent;
    let router: { navigate: ReturnType<typeof vi.fn>; url: string };
    let deleteConfirmationService: { confirmDelete: ReturnType<typeof vi.fn> };
    let dialogRef: { close: ReturnType<typeof vi.fn> };
    let dialog: { open: ReturnType<typeof vi.fn> };
    let songbookService: {
        save: ReturnType<typeof vi.fn>;
        get: ReturnType<typeof vi.fn>;
        getContent: ReturnType<typeof vi.fn>;
        addSong: ReturnType<typeof vi.fn>;
        removeSong: ReturnType<typeof vi.fn>;
        updateSongOrder: ReturnType<typeof vi.fn>;
        updateSongCustomKey: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        dialogRef = { close: vi.fn() };
        dialog = { open: vi.fn().mockReturnValue(dialogRef) };
        songbookService = {
            save: vi.fn().mockResolvedValue('sb-1'),
            get: vi.fn().mockReturnValue(of(null)),
            getContent: vi.fn().mockReturnValue(of([])),
            addSong: vi.fn(),
            removeSong: vi.fn().mockResolvedValue(true),
            updateSongOrder: vi.fn().mockReturnValue(of(true)),
            updateSongCustomKey: vi.fn(),
        };
        router = {
            navigate: vi.fn().mockResolvedValue(true),
            url: '/songbook/sb-1?song=song-1',
        };
        deleteConfirmationService = {
            confirmDelete: vi.fn().mockReturnValue(of(true)),
        };

        component = new SongbookComponent(
            new FormBuilder(),
            dialog as any,
            { paramMap: of(new Map()), snapshot: { paramMap: new Map() } } as any,
            router as any,
            deleteConfirmationService as any,
            { getAll: vi.fn().mockReturnValue(of([])) } as any,
            { searchByTitle: vi.fn().mockReturnValue(of([])) } as any,
            songbookService as any
        );
        component.editSongbookDialog = {} as any;
    });

    it('opens edit dialog with current songbook values', () => {
        const songbook = { uid: 'sb-1', name: 'Teste', leaderName: 'João', eventDate: '2026-03-12' } as any;

        component.openEditHeader(songbook);

        expect(component.headerForm.getRawValue()).toEqual({
            leaderName: 'João',
            eventDate: '2026-03-12',
        });
        expect(dialog.open).toHaveBeenCalledWith(component.editSongbookDialog, {
            width: '520px',
            maxWidth: '95vw',
        });
    });

    it('saves header changes and closes dialog', async () => {
        const songbook = { uid: 'sb-1', name: 'Old', leaderName: 'Ana', eventDate: '2026-03-01' } as any;
        component.openEditHeader(songbook);
        component.headerForm.patchValue({ leaderName: 'Paulo', eventDate: '2026-03-20' });

        await component.saveHeader(songbook);

        expect(songbookService.save).toHaveBeenCalledWith(
            expect.objectContaining({
                uid: 'sb-1',
                name: 'Sexta-feira · 20/03/2026 · Paulo',
                leaderName: 'Paulo',
                eventDate: '2026-03-20',
            })
        );
        expect(songbook.name).toBe('Sexta-feira · 20/03/2026 · Paulo');
        expect(songbook.leaderName).toBe('Paulo');
        expect(songbook.eventDate).toBe('2026-03-20');
        expect(dialogRef.close).toHaveBeenCalled();
    });

    it('does not save header when form is invalid', async () => {
        const songbook = { uid: 'sb-1', name: 'Old', leaderName: 'Ana', eventDate: '2026-03-01' } as any;
        component.headerForm.patchValue({ leaderName: '', eventDate: '' });

        await component.saveHeader(songbook);

        expect(songbookService.save).not.toHaveBeenCalled();
    });

    it('cancels header edit restoring current values', () => {
        component.currentSongbook = { uid: 'sb-1', name: 'Atual', leaderName: 'Líder Atual', eventDate: '2026-04-01' } as any;
        component.headerForm.patchValue({ leaderName: 'Temp', eventDate: '2026-05-01' });
        (component as any)._editDialogRef = dialogRef as any;

        component.cancelEditHeader();

        expect(component.headerForm.getRawValue()).toEqual({
            leaderName: 'Líder Atual',
            eventDate: '2026-04-01',
        });
        expect(dialogRef.close).toHaveBeenCalled();
    });

    it('removes song from songbook when confirmed', async () => {
        (component as any)._route = { snapshot: { paramMap: { get: vi.fn().mockReturnValue('sb-1') } } };

        await component.removeSong({ uid: 'song-1', title: 'Song 1' } as any);

        expect(deleteConfirmationService.confirmDelete).toHaveBeenCalledWith('Song 1');
        expect(songbookService.removeSong).toHaveBeenCalledWith('sb-1', 'song-1');
    });

    it('opens full editor for selected song from preview', () => {
        component.selectedSong = { uid: 'song-1', title: 'Song 1' } as any;

        component.openSelectedSongEditor();

        expect(router.navigate).toHaveBeenCalledWith(['/songs/create', 'song-1'], {
            queryParams: { returnTo: '/songbook/sb-1?song=song-1' },
        });
    });
});
