import { AsyncPipe } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { LeaderService } from 'app/core/firebase/api/leader.service';
import { SongbookService } from 'app/core/firebase/api/songbook.service';
import { Leader } from 'app/models/leader';
import { Songbook } from 'app/models/songbook';
import { BehaviorSubject, map, of, switchMap } from 'rxjs';

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
        MatSelectModule,
        RouterLink,
        TranslocoModule,
    ],
})
export class SongbookListComponent {
    @ViewChild('createSongbookDialog') createSongbookDialog: TemplateRef<unknown>;
    private _createDialogRef: MatDialogRef<unknown> | null = null;
    private _refresh$ = new BehaviorSubject<void>(undefined);
    readonly songbooks$ = this._refresh$.pipe(
        switchMap(() => this._songbookService.getAll()),
        switchMap((songbooks) => {
            if (!songbooks.length) {
                return of([]);
            }

            return this._songbookService.getSongsCountBySongbookIds(songbooks.map((songbook) => songbook.uid)).pipe(
                map((counts) =>
                    songbooks.map((songbook) => ({
                        ...songbook,
                        songsCount: counts[songbook.uid] || 0,
                    }))
                )
            );
        })
    );
    readonly leaders$ = this._leaderService.getAll();
    saving = false;

    readonly form = this._formBuilder.group({
        leaderName: ['', [Validators.required]],
        eventDate: ['', [Validators.required]],
    });

    constructor(
        private _songbookService: SongbookService,
        private _leaderService: LeaderService,
        private _formBuilder: FormBuilder,
        private _dialog: MatDialog,
        private _router: Router
    ) {}

    openCreateDialog(): void {
        this.form.reset({
            leaderName: '',
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
        const leaderName = (value.leaderName || '').trim();
        const eventDate = value.eventDate || '';
        const songbook = {
            name: this.buildSongbookTitle(eventDate, leaderName),
            leaderName,
            eventDate,
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

    async deleteSongbook(songbook: Songbook, event?: Event): Promise<void> {
        event?.preventDefault();
        event?.stopPropagation();

        if (!songbook?.uid || this.saving) {
            return;
        }

        const confirmed = typeof window === 'undefined'
            ? true
            : window.confirm(`Excluir a lista "${songbook.name}"? Essa ação não pode ser desfeita.`);
        if (!confirmed) {
            return;
        }

        this.saving = true;
        const deleted = await this._songbookService.delete(songbook.uid);
        this.saving = false;

        if (deleted) {
            this._refresh$.next();
        }
    }

    trackByLeader(index: number, leader: Leader): string {
        return leader.uid || `${index}`;
    }

    formatSongsCount(count?: number): string {
        const value = count || 0;
        return value === 1 ? '1 música' : `${value} músicas`;
    }

    formatPrimaryLine(songbook: Songbook): string {
        return `${songbook?.leaderName || '-'} · ${this.formatDate(songbook?.eventDate || '')}`;
    }

    formatSecondaryLine(songbook: Songbook & { songsCount?: number }): string {
        return `${this.formatWeekday(songbook?.eventDate || '')} · ${this.formatSongsCount(songbook?.songsCount)}`;
    }

    private formatDate(eventDate: string): string {
        const [year, month, day] = eventDate.split('-');
        if (!year || !month || !day) {
            return '-';
        }

        return `${day}/${month}/${year}`;
    }

    private formatWeekday(eventDate: string): string {
        const dateForWeekday = new Date(`${eventDate}T00:00:00`);
        if (Number.isNaN(dateForWeekday.getTime())) {
            return '-';
        }

        const weekdayRaw = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(dateForWeekday);
        return `${weekdayRaw.charAt(0).toUpperCase()}${weekdayRaw.slice(1)}`;
    }

    private buildSongbookTitle(eventDate: string, leaderName: string): string {
        const formattedDate = this.formatDate(eventDate);
        const weekday = this.formatWeekday(eventDate);

        return `${weekday} · ${formattedDate} · ${leaderName}`.trim();
    }
}
