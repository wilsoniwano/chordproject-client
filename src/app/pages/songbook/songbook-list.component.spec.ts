// @vitest-environment jsdom
import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SongbookListComponent } from './songbook-list.component';

describe('SongbookListComponent', () => {
    let component: SongbookListComponent;
    let dialogRef: { close: ReturnType<typeof vi.fn> };
    let dialog: { open: ReturnType<typeof vi.fn> };
    let songbookService: {
        save: ReturnType<typeof vi.fn>;
        getAll: ReturnType<typeof vi.fn>;
        getSongsCountBySongbookIds: ReturnType<typeof vi.fn>;
        delete: ReturnType<typeof vi.fn>;
    };
    let leaderService: { getAll: ReturnType<typeof vi.fn> };
    let deleteConfirmationService: { confirmDelete: ReturnType<typeof vi.fn> };
    let router: { navigate: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        dialogRef = { close: vi.fn() };
        dialog = { open: vi.fn().mockReturnValue(dialogRef) };
        songbookService = {
            save: vi.fn().mockResolvedValue('sb-1'),
            getAll: vi.fn().mockReturnValue(of([])),
            getSongsCountBySongbookIds: vi.fn().mockReturnValue(of({})),
            delete: vi.fn().mockResolvedValue(true),
        };
        leaderService = {
            getAll: vi.fn().mockReturnValue(of([{ uid: 'l-1', name: 'João' }])),
        };
        deleteConfirmationService = {
            confirmDelete: vi.fn().mockReturnValue(of(true)),
        };
        router = { navigate: vi.fn().mockResolvedValue(true) };

        component = new SongbookListComponent(
            songbookService as any,
            leaderService as any,
            deleteConfirmationService as any,
            new FormBuilder(),
            dialog as any,
            router as any
        );
        component.createSongbookDialog = {} as any;
    });

    it('opens create dialog and resets form', () => {
        component.form.patchValue({ leaderName: 'João', eventDate: '2026-03-04' });

        component.openCreateDialog();

        expect(component.form.getRawValue()).toEqual({ leaderName: '', eventDate: '' });
        expect(dialog.open).toHaveBeenCalledWith(component.createSongbookDialog, {
            width: '520px',
            maxWidth: '95vw',
        });
    });

    it('saves from dialog with generated title and navigates to created songbook', async () => {
        component.openCreateDialog();
        component.form.patchValue({ leaderName: 'João', eventDate: '2026-03-10' });

        await component.saveFromDialog();

        expect(songbookService.save).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Terça-feira · 10/03/2026 · João',
                leaderName: 'João',
                eventDate: '2026-03-10',
            })
        );
        expect(dialogRef.close).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/songbook', 'sb-1']);
    });

    it('does not save when form is invalid', async () => {
        component.form.patchValue({ leaderName: '', eventDate: '' });

        await component.saveFromDialog();

        expect(songbookService.save).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('formats songs count label', () => {
        expect(component.formatSongsCount(0)).toBe('0 músicas');
        expect(component.formatSongsCount(1)).toBe('1 música');
        expect(component.formatSongsCount(3)).toBe('3 músicas');
    });

    it('deletes songbook when confirmed', async () => {
        const event = {
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
        } as any;

        await component.deleteSongbook({ uid: 'sb-1', name: 'Culto' } as any, event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
        expect(deleteConfirmationService.confirmDelete).toHaveBeenCalledWith('Culto');
        expect(songbookService.delete).toHaveBeenCalledWith('sb-1');
    });

    it('does not delete songbook when confirmation is canceled', async () => {
        deleteConfirmationService.confirmDelete.mockReturnValue(of(false));

        await component.deleteSongbook({ uid: 'sb-1', name: 'Culto' } as any);

        expect(songbookService.delete).not.toHaveBeenCalled();
    });
});
