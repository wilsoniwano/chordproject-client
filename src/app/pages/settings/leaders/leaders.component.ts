import { AsyncPipe } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@jsverse/transloco';
import { LeaderService } from 'app/core/firebase/api/leader.service';
import { Leader } from 'app/models/leader';
import { BehaviorSubject, switchMap } from 'rxjs';

@Component({
    selector: 'app-leaders-settings',
    standalone: true,
    templateUrl: './leaders.component.html',
    imports: [
        AsyncPipe,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatTooltipModule,
        TranslocoModule,
    ],
})
export class LeadersComponent {
    private _refresh$ = new BehaviorSubject<void>(undefined);
    readonly leaders$ = this._refresh$.pipe(switchMap(() => this._leaderService.getAll()));
    saving = false;
    currentLeader: Leader | null = null;
    private _editDialogRef: MatDialogRef<unknown> | null = null;

    @ViewChild('editLeaderDialog') editLeaderDialog: TemplateRef<unknown>;

    readonly form = this._formBuilder.group({
        name: ['', [Validators.required, Validators.maxLength(80)]],
    });
    readonly editForm = this._formBuilder.group({
        name: ['', [Validators.required, Validators.maxLength(80)]],
    });

    constructor(
        private _leaderService: LeaderService,
        private _formBuilder: FormBuilder,
        private _dialog: MatDialog
    ) {}

    async saveLeader(): Promise<void> {
        if (this.form.invalid || this.saving) {
            this.form.markAllAsTouched();
            return;
        }

        const payload = {
            name: (this.form.getRawValue().name || '').trim(),
        } as Leader;

        this.saving = true;
        const uid = await this._leaderService.save(payload);
        this.saving = false;

        if (uid) {
            this.form.reset({ name: '' });
            this._refresh$.next();
        }
    }

    async removeLeader(leader: Leader): Promise<void> {
        if (!leader?.uid || this.saving) {
            return;
        }

        const confirmed = typeof window === 'undefined'
            ? true
            : window.confirm(`Excluir o dirigente "${leader.name}"?`);
        if (!confirmed) {
            return;
        }

        this.saving = true;
        const deleted = await this._leaderService.delete(leader.uid);
        this.saving = false;

        if (deleted) {
            this._refresh$.next();
        }
    }

    openEditLeader(leader: Leader): void {
        this.currentLeader = leader;
        this.editForm.patchValue({ name: leader.name || '' });
        this._editDialogRef = this._dialog.open(this.editLeaderDialog, {
            width: '520px',
            maxWidth: '95vw',
        });
    }

    cancelEditLeader(): void {
        if (this.currentLeader) {
            this.editForm.patchValue({ name: this.currentLeader.name || '' });
        }
        this._editDialogRef?.close();
    }

    async saveEditedLeader(): Promise<void> {
        if (this.editForm.invalid || this.saving || !this.currentLeader?.uid) {
            this.editForm.markAllAsTouched();
            return;
        }

        const payload = {
            uid: this.currentLeader.uid,
            name: (this.editForm.getRawValue().name || '').trim(),
        } as Leader;

        this.saving = true;
        const uid = await this._leaderService.save(payload);
        this.saving = false;

        if (uid) {
            this._editDialogRef?.close();
            this._refresh$.next();
        }
    }
}
