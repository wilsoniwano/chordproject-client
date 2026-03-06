import { AsyncPipe } from '@angular/common';
import { Component, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService } from 'app/core/firebase/auth/auth.service';
import { User } from 'app/core/user/user.types';
import { UserService } from 'app/core/user/user.service';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-profile',
    standalone: true,
    templateUrl: './profile.component.html',
    imports: [
        AsyncPipe,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        TranslocoModule,
    ],
})
export class ProfileComponent implements OnDestroy {
    readonly user$ = this._userService.user$;
    readonly editForm = this._formBuilder.group({
        name: ['', [Validators.required, Validators.maxLength(80)]],
        email: ['', [Validators.required, Validators.email]],
    });
    saving = false;
    emailRequestSent = false;
    currentUser: User | null = null;
    private _editDialogRef: MatDialogRef<unknown> | null = null;
    private _unsubscribeAll = new Subject<void>();

    @ViewChild('editProfileDialog') editProfileDialog: TemplateRef<unknown>;

    constructor(
        private _userService: UserService,
        private _authService: AuthService,
        private _formBuilder: FormBuilder,
        private _dialog: MatDialog
    ) {
        this.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe((user) => {
            this.currentUser = user;
            this.editForm.patchValue({
                name: user?.name || '',
                email: user?.email || '',
            });
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    openEditDialog(): void {
        if (!this.currentUser) {
            return;
        }

        this.emailRequestSent = false;
        this.editForm.patchValue({
            name: this.currentUser.name || '',
            email: this.currentUser.email || '',
        });
        this._editDialogRef = this._dialog.open(this.editProfileDialog, {
            width: '520px',
            maxWidth: '95vw',
        });
    }

    cancelEditDialog(): void {
        this._editDialogRef?.close();
    }

    async saveProfile(): Promise<void> {
        if (this.editForm.invalid || this.saving || !this.currentUser) {
            this.editForm.markAllAsTouched();
            return;
        }

        const name = (this.editForm.getRawValue().name || '').trim();
        const email = (this.editForm.getRawValue().email || '').trim();
        const previousName = this.currentUser.name || '';
        const previousEmail = this.currentUser.email || '';

        if (name === previousName && email === previousEmail) {
            this._editDialogRef?.close();
            return;
        }

        this.saving = true;
        this.emailRequestSent = false;
        try {
            if (name !== previousName) {
                await firstValueFrom(this._authService.updateDisplayName(name));
            }

            if (email !== previousEmail) {
                await firstValueFrom(this._authService.requestEmailUpdate(email));
                this.emailRequestSent = true;
            }

            this.saving = false;
            this._editDialogRef?.close();
        } catch {
            this.saving = false;
        }
    }
}
