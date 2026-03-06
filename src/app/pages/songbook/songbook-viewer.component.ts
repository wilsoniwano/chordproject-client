import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseDrawerComponent } from '@fuse/components/drawer';
import { TranslocoModule } from '@jsverse/transloco';
import { TransposeKeyDialogComponent } from 'app/components/transpose-key-dialog/transpose-key-dialog.component';
import { ChpViewerComponent } from 'app/components/viewer/viewer/viewer.component';
import { ParserService } from 'app/core/chordpro/parser.service';
import { SongbookService } from 'app/core/firebase/api/songbook.service';
import { UserService } from 'app/core/user/user.service';
import { PartialSong } from 'app/models/partialsong';
import { Songbook } from 'app/models/songbook';
import { Subject, combineLatest, takeUntil } from 'rxjs';

type SongbookViewerMode = 'normal' | 'paged';

@Component({
    selector: 'songbook-viewer',
    standalone: true,
    templateUrl: './songbook-viewer.component.html',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        TranslocoModule,
        ChpViewerComponent,
        FuseDrawerComponent,
    ],
})
export class SongbookViewerComponent implements OnInit, AfterViewInit, OnDestroy {
    private _unsubscribeAll = new Subject<void>();
    private _currentUserId = 'anonymous';
    private _keyOverrides: Record<string, string> = {};
    private static readonly MIN_FONT_SIZE = 8;
    private static readonly MAX_FONT_SIZE = 24;
    private static readonly DEFAULT_FONT_SIZE = 16;
    private static readonly MIN_COLUMN_WIDTH = 280;
    private static readonly MAX_COLUMN_WIDTH = 1400;
    private static readonly DEFAULT_COLUMN_WIDTH = 640;
    private static readonly COLUMN_WIDTH_STEP = 40;
    private static readonly DEFAULT_COLUMNS_PER_PAGE = 1;

    @ViewChild('songbookViewer') songbookViewer?: ChpViewerComponent;
    @ViewChild('optionsDrawer') optionsDrawer?: FuseDrawerComponent;

    songbookId = '';
    songbook: Songbook | null = null;
    songs: PartialSong[] = [];
    currentIndex = 0;
    renderedContent = '';
    renderedKey: string | null = null;
    fontSize = SongbookViewerComponent.DEFAULT_FONT_SIZE;
    columnWidth = SongbookViewerComponent.DEFAULT_COLUMN_WIDTH;
    columnsPerPage = SongbookViewerComponent.DEFAULT_COLUMNS_PER_PAGE;
    viewMode: SongbookViewerMode = 'paged';
    viewerPageIndex = 1;
    viewerPageTotal = 1;

    constructor(
        private _route: ActivatedRoute,
        private _router: Router,
        private _dialog: MatDialog,
        private _songbookService: SongbookService,
        private _parserService: ParserService,
        private _userService: UserService
    ) {}

    ngOnInit(): void {
        this._route.paramMap.pipe(takeUntil(this._unsubscribeAll)).subscribe((params) => {
            this.songbookId = params.get('uid') || '';
            this.loadKeyOverrides();
            this.loadFontSize();
            this.loadColumnWidth();
            this.loadColumnsPerPage();
            this.loadViewMode();
        });

        this._userService.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe((user) => {
            this._currentUserId = user?.uid || 'anonymous';
            this.loadKeyOverrides();
            this.loadFontSize();
            this.loadColumnWidth();
            this.loadColumnsPerPage();
            this.loadViewMode();
            this.applyCurrentSongRendering();
            this.applyFontSize();
        });

        combineLatest([
            this._route.paramMap,
            this._route.queryParamMap,
        ])
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(([params, queryParams]) => {
                const uid = params.get('uid');
                if (!uid) {
                    return;
                }

                this._songbookService.get(uid).pipe(takeUntil(this._unsubscribeAll)).subscribe((songbook) => {
                    this.songbook = songbook;
                });

                this._songbookService.getContent(uid).pipe(takeUntil(this._unsubscribeAll)).subscribe((songs) => {
                    this.songs = songs;
                    const requestedSongId = queryParams.get('song');
                    if (requestedSongId) {
                        const requestedIndex = this.songs.findIndex((song) => song.uid === requestedSongId);
                        this.currentIndex = requestedIndex >= 0 ? requestedIndex : 0;
                    } else if (this.currentIndex >= this.songs.length) {
                        this.currentIndex = 0;
                    }
                    this.applyCurrentSongRendering();
                    this.applyFontSize();
                });
            });
    }

    ngAfterViewInit(): void {
        this.applyFontSize();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    get currentSong(): PartialSong | null {
        return this.songs[this.currentIndex] || null;
    }

    get isPagedColumnsMode(): boolean {
        return this.viewMode === 'paged';
    }

    get viewerHeaderPrimary(): string {
        const eventDate = this.songbook?.eventDate;
        if (!eventDate) {
            return this.songbook?.name || '-';
        }

        return this.formatWeekday(eventDate);
    }

    get viewerHeaderSecondary(): string {
        const eventDate = this.songbook?.eventDate;
        const leaderName = this.songbook?.leaderName || '';
        if (!eventDate) {
            return leaderName;
        }

        const dateLabel = this.formatDate(eventDate);
        return leaderName ? `${dateLabel} · ${leaderName}` : dateLabel;
    }

    goPrevious(): void {
        if (this.currentIndex <= 0) {
            return;
        }

        this.currentIndex -= 1;
        this.applyCurrentSongRendering();
    }

    goNext(): void {
        if (this.currentIndex >= this.songs.length - 1) {
            return;
        }

        this.currentIndex += 1;
        this.applyCurrentSongRendering();
    }

    openTonePicker(): void {
        const song = this.currentSong;
        if (!song?.songKey) {
            return;
        }

        const currentKey = this._keyOverrides[song.uid] || song.songKey;
        const dialogRef = this._dialog.open(TransposeKeyDialogComponent, {
            width: '420px',
            maxWidth: '95vw',
            data: { currentKey },
        });

        dialogRef.afterClosed().subscribe((selectedKey: string | undefined) => {
            if (!selectedKey || selectedKey === currentKey) {
                return;
            }

            this._keyOverrides[song.uid] = selectedKey;
            this.persistKeyOverrides();
            this.applyCurrentSongRendering();
        });
    }

    resetTranspose(): void {
        const song = this.currentSong;
        if (!song) {
            return;
        }

        delete this._keyOverrides[song.uid];
        this.persistKeyOverrides();
        this.applyCurrentSongRendering();
    }

    increaseFont(): void {
        this.fontSize = this.clampFont(this.fontSize + 1);
        this.persistFontSize();
        this.applyFontSize();
    }

    decreaseFont(): void {
        this.fontSize = this.clampFont(this.fontSize - 1);
        this.persistFontSize();
        this.applyFontSize();
    }

    resetFont(): void {
        this.fontSize = SongbookViewerComponent.DEFAULT_FONT_SIZE;
        this.persistFontSize();
        this.applyFontSize();
    }

    increaseColumnWidth(): void {
        this.columnWidth = this.clampColumnWidth(this.columnWidth + SongbookViewerComponent.COLUMN_WIDTH_STEP);
        this.persistColumnWidth();
    }

    decreaseColumnWidth(): void {
        this.columnWidth = this.clampColumnWidth(this.columnWidth - SongbookViewerComponent.COLUMN_WIDTH_STEP);
        this.persistColumnWidth();
    }

    resetColumnWidth(): void {
        this.columnWidth = SongbookViewerComponent.DEFAULT_COLUMN_WIDTH;
        this.persistColumnWidth();
    }

    setViewMode(mode: SongbookViewerMode): void {
        this.viewMode = mode;
        this.persistViewMode();
        this.songbookViewer?.resetHorizontalPage();
    }

    setColumnsPerPage(value: number): void {
        this.columnsPerPage = this.clampColumnsPerPage(value);
        this.persistColumnsPerPage();
        if (this.viewMode !== 'normal') {
            this.songbookViewer?.resetHorizontalPage();
        }
    }

    goPreviousViewerPage(): void {
        this.songbookViewer?.goToPreviousPage();
    }

    goNextViewerPage(): void {
        this.songbookViewer?.goToNextPage();
    }

    onViewerPageInfoChange(event: { current: number; total: number }): void {
        this.viewerPageIndex = event.current;
        this.viewerPageTotal = event.total;
    }

    async backToSongbook(): Promise<void> {
        const songId = this.currentSong?.uid;
        await this._router.navigate(['/songbook', this.songbookId], {
            queryParams: songId ? { song: songId } : undefined,
        });
    }

    toggleOptionsDrawer(): void {
        this.optionsDrawer?.toggle();
    }

    closeOptionsDrawer(): void {
        this.optionsDrawer?.close();
    }

    private applyCurrentSongRendering(): void {
        const song = this.currentSong;
        if (!song) {
            this.renderedContent = '';
            this.renderedKey = null;
            this.viewerPageIndex = 1;
            this.viewerPageTotal = 1;
            return;
        }

        const overrideKey = this._keyOverrides[song.uid];
        const targetKey = overrideKey || song.songKey || null;
        this.renderedKey = targetKey;

        if (!song.content || !targetKey || !song.songKey || targetKey === song.songKey) {
            this.renderedContent = song.content || '';
            setTimeout(() => this.songbookViewer?.resetHorizontalPage());
            return;
        }

        try {
            const parsed = this._parserService.parseSong(song.content);
            const transposed = this._parserService.transposeSong(parsed, targetKey);
            this.renderedContent = this._parserService.formatToChordPro(transposed);
            setTimeout(() => this.songbookViewer?.resetHorizontalPage());
        } catch {
            this.renderedContent = song.content || '';
            setTimeout(() => this.songbookViewer?.resetHorizontalPage());
        }
    }

    private get storageKey(): string {
        return `chp.songbook.viewer.keys.${this._currentUserId}.${this.songbookId}`;
    }

    private get fontStorageKey(): string {
        return `chp.songbook.viewer.font.${this._currentUserId}.${this.songbookId}`;
    }

    private get viewModeStorageKey(): string {
        return `chp.songbook.viewer.mode.${this._currentUserId}.${this.songbookId}`;
    }

    private get columnWidthStorageKey(): string {
        return `chp.songbook.viewer.columnWidth.${this._currentUserId}.${this.songbookId}`;
    }

    private get columnsPerPageStorageKey(): string {
        return `chp.songbook.viewer.columnsPerPage.${this._currentUserId}.${this.songbookId}`;
    }

    private loadKeyOverrides(): void {
        if (typeof window === 'undefined' || !this.songbookId) {
            return;
        }

        const raw = window.localStorage.getItem(this.storageKey);
        if (!raw) {
            this._keyOverrides = {};
            return;
        }

        try {
            this._keyOverrides = JSON.parse(raw) as Record<string, string>;
        } catch {
            this._keyOverrides = {};
        }
    }

    private persistKeyOverrides(): void {
        if (typeof window === 'undefined' || !this.songbookId) {
            return;
        }

        window.localStorage.setItem(this.storageKey, JSON.stringify(this._keyOverrides));
    }

    private loadFontSize(): void {
        if (typeof window === 'undefined' || !this.songbookId) {
            return;
        }

        const raw = window.localStorage.getItem(this.fontStorageKey);
        if (!raw) {
            this.fontSize = SongbookViewerComponent.DEFAULT_FONT_SIZE;
            return;
        }

        const parsed = Number(raw);
        if (Number.isNaN(parsed)) {
            this.fontSize = SongbookViewerComponent.DEFAULT_FONT_SIZE;
            return;
        }

        this.fontSize = this.clampFont(parsed);
    }

    private persistFontSize(): void {
        if (typeof window === 'undefined' || !this.songbookId) {
            return;
        }

        window.localStorage.setItem(this.fontStorageKey, String(this.fontSize));
    }

    private applyFontSize(): void {
        this.songbookViewer?.setZoom(this.fontSize, false);
    }

    private clampFont(value: number): number {
        return Math.min(SongbookViewerComponent.MAX_FONT_SIZE, Math.max(SongbookViewerComponent.MIN_FONT_SIZE, value));
    }

    private loadViewMode(): void {
        if (typeof window === 'undefined' || !this.songbookId) {
            return;
        }

        const raw = window.localStorage.getItem(this.viewModeStorageKey);
        if (!raw) {
            this.viewMode = 'paged';
            return;
        }

        if (raw === 'normal' || raw === 'paged') {
            this.viewMode = raw;
            return;
        }

        this.viewMode = 'paged';
    }

    private persistViewMode(): void {
        if (typeof window === 'undefined' || !this.songbookId) {
            return;
        }

        window.localStorage.setItem(this.viewModeStorageKey, this.viewMode);
    }

    private loadColumnWidth(): void {
        if (typeof window === 'undefined' || !this.songbookId) {
            return;
        }

        const raw = window.localStorage.getItem(this.columnWidthStorageKey);
        if (!raw) {
            this.columnWidth = SongbookViewerComponent.DEFAULT_COLUMN_WIDTH;
            return;
        }

        const parsed = Number(raw);
        if (Number.isNaN(parsed)) {
            this.columnWidth = SongbookViewerComponent.DEFAULT_COLUMN_WIDTH;
            return;
        }

        this.columnWidth = this.clampColumnWidth(parsed);
    }

    private persistColumnWidth(): void {
        if (typeof window === 'undefined' || !this.songbookId) {
            return;
        }

        window.localStorage.setItem(this.columnWidthStorageKey, String(this.columnWidth));
    }

    private clampColumnWidth(value: number): number {
        return Math.min(
            SongbookViewerComponent.MAX_COLUMN_WIDTH,
            Math.max(SongbookViewerComponent.MIN_COLUMN_WIDTH, value)
        );
    }

    private loadColumnsPerPage(): void {
        if (typeof window === 'undefined' || !this.songbookId) {
            return;
        }

        const raw = window.localStorage.getItem(this.columnsPerPageStorageKey);
        if (!raw) {
            this.columnsPerPage = SongbookViewerComponent.DEFAULT_COLUMNS_PER_PAGE;
            return;
        }

        const parsed = Number(raw);
        this.columnsPerPage = this.clampColumnsPerPage(parsed);
    }

    private persistColumnsPerPage(): void {
        if (typeof window === 'undefined' || !this.songbookId) {
            return;
        }

        window.localStorage.setItem(this.columnsPerPageStorageKey, String(this.columnsPerPage));
    }

    private clampColumnsPerPage(value: number): number {
        return value === 2 ? 2 : 1;
    }

    private formatDate(eventDate: string): string {
        const [year, month, day] = eventDate.split('-');
        if (!year || !month || !day) {
            return eventDate;
        }

        return `${day}/${month}/${year}`;
    }

    private formatWeekday(eventDate: string): string {
        const date = new Date(`${eventDate}T12:00:00`);
        if (Number.isNaN(date.getTime())) {
            return eventDate;
        }

        const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date);
        return weekday.charAt(0).toUpperCase() + weekday.slice(1);
    }
}
