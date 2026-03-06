// @vitest-environment jsdom
import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LeadersComponent } from './leaders.component';

describe('LeadersComponent', () => {
    let component: LeadersComponent;
    let leaderService: { save: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn>; getAll: ReturnType<typeof vi.fn> };
    let dialogRef: { close: ReturnType<typeof vi.fn> };
    let dialog: { open: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        leaderService = {
            save: vi.fn().mockResolvedValue('l-1'),
            delete: vi.fn(),
            getAll: vi.fn(),
        };
        dialogRef = { close: vi.fn() };
        dialog = { open: vi.fn().mockReturnValue(dialogRef) };

        component = new LeadersComponent(leaderService as any, new FormBuilder(), dialog as any);
        component.editLeaderDialog = {} as any;
    });

    it('opens edit leader modal with selected leader data', () => {
        const leader = { uid: 'l-1', name: 'Tamanaka' } as any;

        component.openEditLeader(leader);

        expect(component.currentLeader).toEqual(leader);
        expect(component.editForm.getRawValue()).toEqual({ name: 'Tamanaka' });
        expect(dialog.open).toHaveBeenCalledWith(component.editLeaderDialog, {
            width: '520px',
            maxWidth: '95vw',
        });
    });

    it('saves edited leader', async () => {
        component.currentLeader = { uid: 'l-1', name: 'Antigo' } as any;
        component.editForm.patchValue({ name: 'Novo Nome' });
        (component as any)._editDialogRef = dialogRef as any;

        await component.saveEditedLeader();

        expect(leaderService.save).toHaveBeenCalledWith({
            uid: 'l-1',
            name: 'Novo Nome',
        });
        expect(dialogRef.close).toHaveBeenCalled();
    });

    it('does not save edited leader when form is invalid', async () => {
        component.currentLeader = { uid: 'l-1', name: 'Antigo' } as any;
        component.editForm.patchValue({ name: '' });

        await component.saveEditedLeader();

        expect(leaderService.save).not.toHaveBeenCalled();
    });
});
