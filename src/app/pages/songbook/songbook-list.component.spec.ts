// @vitest-environment jsdom
import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SongbookListComponent } from './songbook-list.component';

describe('SongbookListComponent', () => {
    let component: SongbookListComponent;
    let dialogRef: { close: ReturnType<typeof vi.fn> };
    let dialog: { open: ReturnType<typeof vi.fn> };
    let songbookService: { save: ReturnType<typeof vi.fn>; getAll: ReturnType<typeof vi.fn> };
    let router: { navigate: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        dialogRef = { close: vi.fn() };
        dialog = { open: vi.fn().mockReturnValue(dialogRef) };
        songbookService = {
            save: vi.fn().mockResolvedValue('sb-1'),
            getAll: vi.fn(),
        };
        router = { navigate: vi.fn().mockResolvedValue(true) };

        component = new SongbookListComponent(
            songbookService as any,
            new FormBuilder(),
            dialog as any,
            router as any
        );
        component.createSongbookDialog = {} as any;
    });

    it('opens create dialog and resets form', () => {
        component.form.patchValue({ name: 'Anterior', eventDate: '2026-03-04' });

        component.openCreateDialog();

        expect(component.form.getRawValue()).toEqual({ name: '', eventDate: '' });
        expect(dialog.open).toHaveBeenCalledWith(component.createSongbookDialog, {
            width: '520px',
            maxWidth: '95vw',
        });
    });

    it('saves from dialog with trimmed name and navigates to created songbook', async () => {
        component.openCreateDialog();
        component.form.patchValue({ name: '  Culto  ', eventDate: '2026-03-10' });

        await component.saveFromDialog();

        expect(songbookService.save).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Culto',
                eventDate: '2026-03-10',
            })
        );
        expect(dialogRef.close).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/songbook', 'sb-1']);
    });

    it('does not save when form is invalid', async () => {
        component.form.patchValue({ name: '', eventDate: '' });

        await component.saveFromDialog();

        expect(songbookService.save).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('formats event date as dd/mm/yyyy', () => {
        expect(component.formatEventDate({ eventDate: '2026-12-05' } as any)).toBe('05/12/2026');
        expect(component.formatEventDate({ eventDate: '' } as any)).toBe('-');
    });
});
