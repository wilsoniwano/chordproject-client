import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, UntypedFormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ChpSongItemComponent } from 'app/components/song-item/song-item.component';
import { ChpSplitLayoutComponent } from 'app/components/split-layout/split-layout.component';
import { ChpViewerComponent } from 'app/components/viewer/viewer/viewer.component';
import { SongService } from 'app/core/firebase/api/song.service';
import { SongbookService } from 'app/core/firebase/api/songbook.service';
import { PartialSong } from 'app/models/partialsong';
import { Songbook } from 'app/models/songbook';
import { Observable, Subject, firstValueFrom, of, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
    selector: 'chp-songbook',
    standalone: true,
    templateUrl: './songbook.component.html',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DragDropModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        TranslocoModule,
        RouterLink,
        ChpViewerComponent,
        ChpSongItemComponent,
        ChpSplitLayoutComponent,
    ],
})
export class SongbookComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    selectedSong: PartialSong | null = null;
    addSongControl: UntypedFormControl = new UntypedFormControl('');
    songSearchResults: PartialSong[] = [];
    addingSong = false;
    savingHeader = false;
    currentSongbook: Songbook | null = null;
    private _editDialogRef: MatDialogRef<unknown> | null = null;

    readonly headerForm = this._formBuilder.group({
        name: ['', [Validators.required, Validators.maxLength(80)]],
        eventDate: ['', [Validators.required]],
    });

    @ViewChild(ChpSplitLayoutComponent) splitLayout: ChpSplitLayoutComponent;
    @ViewChild('editSongbookDialog') editSongbookDialog: TemplateRef<unknown>;

    songbook$: Observable<Songbook>;
    songs$: Observable<PartialSong[]>;
    songsList: PartialSong[] = [];

    constructor(
        private _formBuilder: FormBuilder,
        private _dialog: MatDialog,
        private _route: ActivatedRoute,
        private _router: Router,
        private _songService: SongService,
        private _songbookService: SongbookService
    ) {}

    ngOnInit(): void {
        this.loadSongbook();
        this.loadSongs();
        this.initSongSearch();
    }

    private loadSongbook(): void {
        this.songbook$ = this._route.paramMap.pipe(
            takeUntil(this._unsubscribeAll),
            switchMap((params) => this._songbookService.get(params.get('uid')))
        );

        this.songbook$.pipe(takeUntil(this._unsubscribeAll)).subscribe((songbook) => {
            this.currentSongbook = songbook;
            this.headerForm.patchValue({
                name: songbook.name || '',
                eventDate: songbook.eventDate || '',
            });
        });
    }

    private loadSongs(): void {
        this.songs$ = this._route.paramMap.pipe(
            takeUntil(this._unsubscribeAll),
            switchMap((params) => {
                // Reset selected song when route changes
                this.selectedSong = null;
                return this._songbookService.getContent(params.get('uid'));
            })
        );

        this.songs$.pipe(takeUntil(this._unsubscribeAll)).subscribe((songs) => {
            this.songsList = [...songs];
            this.filterOutAlreadyAddedSongs();
        });
    }

    private initSongSearch(): void {
        this.addSongControl.valueChanges
            .pipe(
                debounceTime(250),
                distinctUntilChanged(),
                switchMap((value) => {
                    const searchTerm = (value || '').trim();
                    if (searchTerm.length < 2) {
                        return of([]);
                    }

                    return this._songService.searchByTitle(searchTerm, 8);
                }),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe((songs) => {
                this.songSearchResults = songs;
                this.filterOutAlreadyAddedSongs();
            });
    }

    async addSong(song: PartialSong): Promise<void> {
        if (this.addingSong) {
            return;
        }

        const songbookId = this._route.snapshot.paramMap.get('uid');
        if (!songbookId) {
            return;
        }

        this.addingSong = true;
        const relationId = await this._songbookService.addSong(songbookId, song.uid, this.songsList.length);

        if (relationId) {
            await this.refreshSongs(songbookId);
            this.addSongControl.setValue('');
            this.songSearchResults = [];
        }

        this.addingSong = false;
    }

    private filterOutAlreadyAddedSongs(): void {
        const currentSongIds = new Set(this.songsList.map((song) => song.uid));
        this.songSearchResults = this.songSearchResults.filter((song) => !currentSongIds.has(song.uid));
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    onDrop(event: CdkDragDrop<PartialSong[]>) {
        if (event.previousIndex === event.currentIndex) {
            return;
        }

        // Actualizar la UI inmediatamente
        moveItemInArray(this.songsList, event.previousIndex, event.currentIndex);

        // Preparar datos para BD
        const songOrders = this.songsList.map((song, index) => ({
            songId: song.uid,
            order: index,
        }));

        // Actualizar en Firebase sin recargar después
        const songbookId = this._route.snapshot.paramMap.get('uid');
        this._songbookService.updateSongOrder(songbookId, songOrders).pipe(takeUntil(this._unsubscribeAll)).subscribe();
    }

    async onSongKeyChange(song: PartialSong, key: string): Promise<void> {
        const songbookId = this._route.snapshot.paramMap.get('uid');
        if (!songbookId) {
            return;
        }

        const success = await this._songbookService.updateSongCustomKey(songbookId, song.uid, key);
        if (success) {
            await this.refreshSongs(songbookId, song.uid);
        }
    }

    selectSong(song: PartialSong): void {
        this.selectedSong = song;

        // If we're in mobile mode, toggle the preview to show the right panel
        if (this.splitLayout?.isMobile) {
            this.splitLayout.togglePreview();
        }
    }

    onDblClick(song: PartialSong): void {
        this._router.navigate(['/songs/read', song.uid]);
    }

    trackByFn(index: number, item: any): any {
        return item.uid || index;
    }

    openEditHeader(songbook: Songbook): void {
        this.currentSongbook = songbook;
        this.headerForm.patchValue({
            name: songbook.name || '',
            eventDate: songbook.eventDate || '',
        });
        this._editDialogRef = this._dialog.open(this.editSongbookDialog, {
            width: '520px',
            maxWidth: '95vw',
        });
    }

    cancelEditHeader(): void {
        if (this.currentSongbook) {
            this.headerForm.patchValue({
                name: this.currentSongbook.name || '',
                eventDate: this.currentSongbook.eventDate || '',
            });
        }
        this._editDialogRef?.close();
    }

    async saveHeader(songbook: Songbook): Promise<void> {
        if (this.headerForm.invalid || this.savingHeader) {
            this.headerForm.markAllAsTouched();
            return;
        }

        const value = this.headerForm.getRawValue();
        const payload = {
            ...songbook,
            name: (value.name || '').trim(),
            eventDate: value.eventDate || '',
        } as Songbook;

        this.savingHeader = true;
        const uid = await this._songbookService.save(payload);
        this.savingHeader = false;

        if (uid) {
            songbook.name = payload.name;
            songbook.eventDate = payload.eventDate;
            this.currentSongbook = { ...songbook };
            this._editDialogRef?.close();
        }
    }

    formatEventDate(eventDate?: string): string {
        if (!eventDate) {
            return '-';
        }

        const [year, month, day] = eventDate.split('-');
        if (!year || !month || !day) {
            return '-';
        }

        return `${day}/${month}/${year}`;
    }

    private async refreshSongs(songbookId: string, selectedSongId?: string): Promise<void> {
        const currentSelectedId = selectedSongId || this.selectedSong?.uid;
        const songs = await firstValueFrom(this._songbookService.getContent(songbookId));
        this.songsList = [...songs];
        this.filterOutAlreadyAddedSongs();

        if (currentSelectedId) {
            this.selectedSong = this.songsList.find((song) => song.uid === currentSelectedId) || null;
        }
    }
}
