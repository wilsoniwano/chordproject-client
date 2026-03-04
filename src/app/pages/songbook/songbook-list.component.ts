import { AsyncPipe } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { SongbookService } from 'app/core/firebase/api/songbook.service';
import { Songbook } from 'app/models/songbook';
import { BehaviorSubject, switchMap } from 'rxjs';

@Component({
    selector: 'songbook-list',
    standalone: true,
    templateUrl: './songbook-list.component.html',
    imports: [
        AsyncPipe,
        ReactiveFormsModule,
        MatIconModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        RouterLink,
        TranslocoModule,
    ],
})
export class SongbookListComponent {
    @ViewChild('createSongbookDialog') createSongbookDialog: TemplateRef<unknown>;
    private _createDialogRef: MatDialogRef<unknown> | null = null;
    private _refresh$ = new BehaviorSubject<void>(undefined);
    readonly songbooks$ = this._refresh$.pipe(switchMap(() => this._songbookService.getAll()));
    saving = false;

    readonly form = this._formBuilder.group({
        name: ['', [Validators.required, Validators.maxLength(80)]],
        eventDate: ['', [Validators.required]],
    });

    constructor(
        private _songbookService: SongbookService,
        private _formBuilder: FormBuilder,
        private _dialog: MatDialog,
        private _router: Router
    ) {}

    openCreateDialog(): void {
        this.form.reset({
            name: '',
            eventDate: '',
        });
        this._createDialogRef = this._dialog.open(this.createSongbookDialog, {
            width: '520px',
            maxWidth: '95vw',
        });
    }

    cancelCreateDialog(): void {
        this._createDialogRef?.close();
    }

    async saveFromDialog(): Promise<void> {
        if (this.form.invalid || this.saving) {
            this.form.markAllAsTouched();
            return;
        }

        const value = this.form.getRawValue();
        const songbook = {
            name: (value.name || '').trim(),
            eventDate: value.eventDate || '',
            parent: '',
            isReorderable: true,
            badgeText: '',
            order: '',
        } as Songbook;

        this.saving = true;
        const uid = await this._songbookService.save(songbook);
        this.saving = false;

        if (uid) {
            this._createDialogRef?.close();
            this._refresh$.next();
            await this._router.navigate(['/songbook', uid]);
        }
    }

    formatEventDate(songbook: Songbook): string {
        if (!songbook?.eventDate) {
            return '-';
        }

        const [year, month, day] = songbook.eventDate.split('-');
        if (!year || !month || !day) {
            return '-';
        }

        return `${day}/${month}/${year}`;
    }
}
