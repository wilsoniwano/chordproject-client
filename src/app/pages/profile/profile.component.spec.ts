// @vitest-environment jsdom
import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
    let component: ProfileComponent;
    let authService: {
        updateDisplayName: ReturnType<typeof vi.fn>;
        requestEmailUpdate: ReturnType<typeof vi.fn>;
    };
    let user$: BehaviorSubject<any>;
    let dialogRef: { close: ReturnType<typeof vi.fn> };
    let dialog: { open: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        user$ = new BehaviorSubject({
            uid: 'user-1',
            name: 'Tamanaka',
            email: 'old@email.com',
            emailVerified: true,
            avatar: '',
        });

        authService = {
            updateDisplayName: vi.fn().mockReturnValue(of(void 0)),
            requestEmailUpdate: vi.fn().mockReturnValue(of(void 0)),
        };
        dialogRef = { close: vi.fn() };
        dialog = { open: vi.fn().mockReturnValue(dialogRef) };

        component = new ProfileComponent(
            { user$ } as any,
            authService as any,
            new FormBuilder(),
            dialog as any
        );
        component.editProfileDialog = {} as any;
    });

    it('loads current user data into forms', () => {
        expect(component.editForm.getRawValue().name).toBe('Tamanaka');
        expect(component.editForm.getRawValue().email).toBe('old@email.com');
    });

    it('opens edit dialog with current values', () => {
        component.openEditDialog();

        expect(dialog.open).toHaveBeenCalledWith(component.editProfileDialog, {
            width: '520px',
            maxWidth: '95vw',
        });
        expect(component.editForm.getRawValue()).toEqual({
            name: 'Tamanaka',
            email: 'old@email.com',
        });
    });

    it('saves profile name and requests email update when both changed', async () => {
        component.openEditDialog();
        component.editForm.patchValue({ name: 'Nome Novo', email: 'new@email.com' });

        await component.saveProfile();

        expect(authService.updateDisplayName).toHaveBeenCalledWith('Nome Novo');
        expect(authService.requestEmailUpdate).toHaveBeenCalledWith('new@email.com');
        expect(component.emailRequestSent).toBe(true);
        expect(dialogRef.close).toHaveBeenCalled();
        expect(component.saving).toBe(false);
    });

    it('closes modal without calling services when nothing changed', async () => {
        component.openEditDialog();
        component.editForm.patchValue({ name: 'Tamanaka', email: 'old@email.com' });

        await component.saveProfile();

        expect(authService.updateDisplayName).not.toHaveBeenCalled();
        expect(authService.requestEmailUpdate).not.toHaveBeenCalled();
        expect(dialogRef.close).toHaveBeenCalled();
    });

    it('saves only display name when only name changed', async () => {
        component.openEditDialog();
        component.editForm.patchValue({ name: 'Nome Novo', email: 'old@email.com' });

        await component.saveProfile();

        expect(authService.updateDisplayName).toHaveBeenCalledWith('Nome Novo');
        expect(authService.requestEmailUpdate).not.toHaveBeenCalled();
        expect(dialogRef.close).toHaveBeenCalled();
        expect(component.saving).toBe(false);
    });

    it('keeps modal open on request failure', async () => {
        authService.requestEmailUpdate.mockReturnValue(throwError(() => new Error('erro')));
        component.openEditDialog();
        component.editForm.patchValue({ name: 'Nome Novo', email: 'new@email.com' });

        await component.saveProfile();

        expect(dialogRef.close).not.toHaveBeenCalled();
        expect(component.emailRequestSent).toBe(false);
        expect(component.saving).toBe(false);
    });
});
