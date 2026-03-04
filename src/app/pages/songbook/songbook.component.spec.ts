// @vitest-environment jsdom
import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SongbookComponent } from './songbook.component';

describe('SongbookComponent', () => {
    let component: SongbookComponent;
    let dialogRef: { close: ReturnType<typeof vi.fn> };
    let dialog: { open: ReturnType<typeof vi.fn> };
    let songbookService: {
        save: ReturnType<typeof vi.fn>;
        get: ReturnType<typeof vi.fn>;
        getContent: ReturnType<typeof vi.fn>;
        addSong: ReturnType<typeof vi.fn>;
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
            updateSongOrder: vi.fn().mockReturnValue(of(true)),
            updateSongCustomKey: vi.fn(),
        };

        component = new SongbookComponent(
            new FormBuilder(),
            dialog as any,
            { paramMap: of(new Map()), snapshot: { paramMap: new Map() } } as any,
            { navigate: vi.fn().mockResolvedValue(true) } as any,
            { searchByTitle: vi.fn().mockReturnValue(of([])) } as any,
            songbookService as any
        );
        component.editSongbookDialog = {} as any;
    });

    it('opens edit dialog with current songbook values', () => {
        const songbook = { uid: 'sb-1', name: 'Teste', eventDate: '2026-03-12' } as any;

        component.openEditHeader(songbook);

        expect(component.headerForm.getRawValue()).toEqual({
            name: 'Teste',
            eventDate: '2026-03-12',
        });
        expect(dialog.open).toHaveBeenCalledWith(component.editSongbookDialog, {
            width: '520px',
            maxWidth: '95vw',
        });
    });

    it('saves header changes and closes dialog', async () => {
        const songbook = { uid: 'sb-1', name: 'Old', eventDate: '2026-03-01' } as any;
        component.openEditHeader(songbook);
        component.headerForm.patchValue({ name: '  Novo  ', eventDate: '2026-03-20' });

        await component.saveHeader(songbook);

        expect(songbookService.save).toHaveBeenCalledWith(
            expect.objectContaining({
                uid: 'sb-1',
                name: 'Novo',
                eventDate: '2026-03-20',
            })
        );
        expect(songbook.name).toBe('Novo');
        expect(songbook.eventDate).toBe('2026-03-20');
        expect(dialogRef.close).toHaveBeenCalled();
    });

    it('does not save header when form is invalid', async () => {
        const songbook = { uid: 'sb-1', name: 'Old', eventDate: '2026-03-01' } as any;
        component.headerForm.patchValue({ name: '', eventDate: '' });

        await component.saveHeader(songbook);

        expect(songbookService.save).not.toHaveBeenCalled();
    });

    it('cancels header edit restoring current values', () => {
        component.currentSongbook = { uid: 'sb-1', name: 'Atual', eventDate: '2026-04-01' } as any;
        component.headerForm.patchValue({ name: 'Temp', eventDate: '2026-05-01' });
        (component as any)._editDialogRef = dialogRef as any;

        component.cancelEditHeader();

        expect(component.headerForm.getRawValue()).toEqual({
            name: 'Atual',
            eventDate: '2026-04-01',
        });
        expect(dialogRef.close).toHaveBeenCalled();
    });
});
