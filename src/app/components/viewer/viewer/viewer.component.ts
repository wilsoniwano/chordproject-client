import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { ParserService } from 'app/core/chordpro/parser.service';
import { ViewSettingsService } from 'app/core/chordpro/viewsettings.service';
import { SafeHtmlPipe } from 'app/pipes/safeHtml.pipe';
import { ViewSettings } from 'app/tools/view-customization/view-settings';
import { Song } from 'chordproject-parser';

type ViewerMode = 'normal' | 'paged';
type ChordDiagramViewModel = {
    chord: string;
    baseFret: number;
    frets: number[];
};

@Component({
    selector: 'chp-viewer',
    templateUrl: './viewer.component.html',
    styleUrls: ['./viewer.component.scss'],
    standalone: true,
    imports: [SafeHtmlPipe],
})
export class ChpViewerComponent implements AfterViewInit, OnChanges {
    private static readonly ZOOM_STORAGE_KEY = 'chp.viewer.fontSize';
    private static readonly MIN_ZOOM = 8;
    private static readonly MAX_ZOOM = 24;
    private static readonly MIN_PAGED_COLUMN_WIDTH = 280;
    private static readonly PAGED_COLUMN_GAP = 32;
    @ViewChild('viewerContent') contentElementRef: ElementRef;

    @Input() isPreview = false;
    @Input() autoColumns = false;
    @Input() forceDarkHeaderBackground = false;
    @Input() forceDarkBackground = false;
    @Input() viewMode: ViewerMode = 'normal';
    @Input() pagedColumnWidth = ChpViewerComponent.MIN_PAGED_COLUMN_WIDTH;
    @Input() normalColumnCount = 1;
    @Output() pageInfoChange = new EventEmitter<{ current: number; total: number }>();
    @Input()
    set content(value: string) {
        this._content = value;
        this.parseSong();
    }
    get content(): string {
        return this._content;
    }

    private _content: string;
    private _initialSong: Song;
    private _currentSong: Song;
    private get currentSong(): Song {
        return this._currentSong;
    }
    private set currentSong(song: Song) {
        this._currentSong = song;
        this.formatSong();
    }

    splitAreasSize = {
        song: 80,
        chords: 20,
    };
    songHtml: string;
    chordDiagrams: ChordDiagramViewModel[] = [];
    fontSize = 16;
    isLoading = true;
    contentElement: HTMLElement;
    viewSettings: ViewSettings;

    get shouldShowColumns(): boolean {
        if (this.isPreview) {
            return false;
        }

        return !!this.viewSettings?.showColumns;
    }

    get isPagedColumnsMode(): boolean {
        return !this.isPreview && this.viewMode === 'paged';
    }

    constructor(
        private parserService: ParserService,
        private viewSettingsService: ViewSettingsService
    ) {
        this.fontSize = this.loadSavedZoom();
        this.viewSettingsService.getViewSettings().subscribe((settings) => this.setViewSettings(settings));
    }

    ngAfterViewInit(): void {
        this.contentElement = this.contentElementRef.nativeElement;
        this.applyZoomToSongContent();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.contentElement) {
            return;
        }

        if (changes['autoColumns'] || changes['viewMode'] || changes['pagedColumnWidth'] || changes['normalColumnCount']) {
            setTimeout(() => this.applyZoomToSongContent());
        }
    }

    @HostListener('window:resize')
    onWindowResize(): void {
        this.applyZoomToSongContent();
    }

    onContentScroll(): void {
        this.emitPageInfo();
    }

    private parseSong() {
        if (this._content) {
            this._initialSong = this.parserService.parseSong(this._content);
            this.currentSong = this._initialSong;
        } else {
            this.songHtml = '';
            this.chordDiagrams = [];
        }
    }

    private setSongHtml(value: string): void {
        this.songHtml = value;
        this.isLoading = false;
        setTimeout(() => this.applyZoomToSongContent());
    }

    private formatSong() {
        if (!this.currentSong || !this.viewSettings) {
            return;
        }

        const songHtml = this.parserService.formatToHtml(
            this._currentSong,
            true,
            this.isPreview ? true : this.viewSettings.showChords,
            this.isPreview ? true : this.viewSettings.showTabs
        );
        this.chordDiagrams = this.buildChordDiagrams((this._currentSong as any).userDiagrams ?? []);
        const htmlWithAlbum = this.injectMissingAlbumMetadata(songHtml);
        this.setSongHtml(this.normalizeMetadataOrder(htmlWithAlbum));
    }

    private buildChordDiagrams(diagrams: any[]): ChordDiagramViewModel[] {
        return diagrams.map((diagram) => {
            const relative = typeof diagram.getRelativeFrets === 'function' ? diagram.getRelativeFrets() : null;
            const baseFret = relative?.[0] ?? 1;
            const frets = (relative?.[1] ?? diagram.frets ?? []).map((fret: number) => Number(fret));

            return {
                chord: diagram.chord.toString(),
                baseFret,
                frets,
            };
        });
    }

    private injectMissingAlbumMetadata(html: string): string {
        if (!html || !this.currentSong) {
            return html;
        }

        if (/album-metadata/i.test(html)) {
            return html;
        }

        const albums = (this.currentSong as any).albums?.filter((album: string) => !!album?.trim?.()) ?? [];
        if (!albums.length) {
            return html;
        }

        const albumText = this.escapeHtml(albums.join(', '));
        const albumHtml = `<div class="metadata album-metadata">Album: ${albumText}</div>`;

        return html.replace(
            /(<div class=?["']?song-metadata["']?[^>]*>[\s\S]*?)(<\/div>)/i,
            `$1${albumHtml}$2`
        );
    }

    private normalizeMetadataOrder(html: string): string {
        if (!html || typeof DOMParser === 'undefined') {
            return html;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div id="metadata-root">${html}</div>`, 'text/html');
        const root = doc.querySelector('#metadata-root');
        const metadata = root?.querySelector('.song-metadata');
        if (!root || !metadata) {
            return html;
        }

        const orderedClassNames = [
            'title-metadata',
            'artist-metadata',
            'album-metadata',
            'key-metadata',
            'tempo-metadata',
            'time-metadata',
        ];
        const orderedNodes: Element[] = [];

        for (const className of orderedClassNames) {
            const node = metadata.querySelector(`.${className}`);
            if (!node) {
                continue;
            }

            orderedNodes.push(node);
            node.remove();
        }

        const remainingNodes = Array.from(metadata.childNodes);
        metadata.replaceChildren(...orderedNodes, ...remainingNodes);
        return root.innerHTML;
    }

    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    zoom(value: number): void {
        this.setZoom(value, true);
    }

    goToPreviousPage(): void {
        if (!this.contentElement || !this.isPagedColumnsMode) {
            return;
        }

        this.contentElement.scrollBy({ left: -this.contentElement.clientWidth, behavior: 'smooth' });
        setTimeout(() => this.emitPageInfo(), 180);
    }

    goToNextPage(): void {
        if (!this.contentElement || !this.isPagedColumnsMode) {
            return;
        }

        this.contentElement.scrollBy({ left: this.contentElement.clientWidth, behavior: 'smooth' });
        setTimeout(() => this.emitPageInfo(), 180);
    }

    resetHorizontalPage(): void {
        if (!this.contentElement) {
            return;
        }

        this.contentElement.scrollLeft = 0;
        this.emitPageInfo();
    }

    setZoom(value: number, persist = true): void {
        if (!value) {
            return;
        }

        this.fontSize = this.clampZoom(value);
        if (persist) {
            this.saveZoom(this.fontSize);
        }
        this.applyZoomToSongContent();
    }

    transpose(letter: string): void {
        if (!this.currentSong) {
            return;
        }
        this.currentSong = this.parserService.transposeSong(this._initialSong, letter);
    }

    private setViewSettings(settings: ViewSettings): void {
        const oldSettings = this.viewSettings != undefined ? Object.assign({}, this.viewSettings) : undefined;
        const newSettings = Object.assign({}, settings);
        this.viewSettings = newSettings;
        if (!oldSettings) {
            return;
        }

        if (oldSettings.showChords != newSettings.showChords || oldSettings.showTabs != newSettings.showTabs) {
            this.formatSong();
        }
    }

    private applyZoomToSongContent(): void {
        if (!this.contentElement) {
            return;
        }

        const contentInner = this.contentElement.querySelector('.content-inner') as HTMLElement | null;
        const songContent = this.contentElement.querySelector('.song-content') as HTMLElement | null;
        const content = this.contentElement.querySelector('.content') as HTMLElement | null;
        if (!content && !songContent && !contentInner) {
            return;
        }

        const fontTarget = songContent || contentInner || content!;
        if (songContent) {
            songContent.style.fontSize = `${this.fontSize}px`;
        }
        if (contentInner) {
            contentInner.style.fontSize = `${this.fontSize}px`;
        }
        if (content) {
            content.style.fontSize = `${this.fontSize}px`;
        }

        if (this.isPagedColumnsMode) {
            const pageWidth = this.clampPagedColumnWidth(this.pagedColumnWidth);
            const containerHeight = this.contentElement.clientHeight || 720;
            const columnsPerPage = 1;
            const columnHost = contentInner || songContent || content!;
            this.contentElement.style.overflowX = 'auto';
            this.contentElement.style.overflowY = 'hidden';

            if (content) {
                content.style.overflow = 'visible';
                content.style.height = '100%';
                content.style.flex = '0 0 auto';
                content.style.minWidth = '';
                content.style.width = '';
                content.style.position = '';
                content.style.inset = '';
            }

            columnHost.style.height = '100%';
            columnHost.style.columnFill = 'auto';
            columnHost.style.columnGap = `${ChpViewerComponent.PAGED_COLUMN_GAP}px`;
            columnHost.style.columnCount = '1';
            columnHost.style.columnWidth = `${pageWidth}px`;
            columnHost.style.width = `${pageWidth}px`;
            columnHost.style.minWidth = `${pageWidth}px`;

            // Measure the full content height using one fixed-width page,
            // then derive the exact number of horizontal pages.
            columnHost.style.height = 'auto';
            const naturalHeight = Math.max(columnHost.scrollHeight, columnHost.offsetHeight);
            const totalColumns = Math.max(1, Math.ceil(naturalHeight / containerHeight));
            const pages = Math.max(1, Math.ceil(totalColumns / columnsPerPage));
            const viewportWidth =
                columnsPerPage * pageWidth + Math.max(0, columnsPerPage - 1) * ChpViewerComponent.PAGED_COLUMN_GAP;

            columnHost.style.height = '100%';
            columnHost.style.columnCount = String(totalColumns);
            columnHost.style.columnWidth = `${pageWidth}px`;
            columnHost.style.width = `${pages * viewportWidth + Math.max(0, pages - 1) * ChpViewerComponent.PAGED_COLUMN_GAP}px`;
            this.contentElement.style.scrollSnapType = 'x mandatory';
            this.contentElement.style.scrollBehavior = 'smooth';
            this.contentElement.style.position = '';
            this.emitPageInfo();
            return;
        }

        const normalColumns = this.clampColumnsPerPage(this.normalColumnCount);
        this.contentElement.style.overflowX = '';
        this.contentElement.style.overflowY = '';
        this.contentElement.style.scrollSnapType = '';
        this.contentElement.style.scrollBehavior = '';
        this.contentElement.style.position = '';

        if (content) {
            content.style.overflow = '';
            content.style.height = '';
            content.style.flex = '';
            content.style.minWidth = '';
            content.style.width = '';
            content.style.position = '';
            content.style.inset = '';
        }

        if (contentInner) {
            contentInner.style.height = '';
            contentInner.style.columnFill = '';
            contentInner.style.columnGap = '';
            contentInner.style.columnCount = '';
            contentInner.style.columnWidth = '';
            contentInner.style.width = '';
            contentInner.style.minWidth = '';
            contentInner.style.transform = '';
            contentInner.style.transition = '';
            contentInner.style.overflow = '';
            contentInner.style.position = '';
            contentInner.style.inset = '';
        }

        if (content) {
            content.style.height = '';
            content.style.columnFill = '';
            content.style.columnGap = '';
            content.style.columnCount = '';
            content.style.columnWidth = '';
            content.style.width = '';
            content.style.minWidth = '';
        }

        if (songContent) {
            songContent.style.height = '';
            songContent.style.columnFill = '';
            songContent.style.columnGap = '';
            songContent.style.columnCount = '';
            songContent.style.columnWidth = '';
            songContent.style.width = '';
            songContent.style.minWidth = '';
            songContent.style.transform = '';
            songContent.style.transition = '';
        }

        if (!this.isPreview && normalColumns > 1) {
            const normalHost = contentInner || songContent || content;
            if (normalHost) {
                normalHost.style.columnFill = 'balance';
                normalHost.style.columnGap = `${ChpViewerComponent.PAGED_COLUMN_GAP}px`;
                normalHost.style.columnCount = String(normalColumns);
            }
        }

        fontTarget.style.fontSize = `${this.fontSize}px`;
        this.emitPageInfo();
    }

    private loadSavedZoom(): number {
        if (typeof window === 'undefined') {
            return 16;
        }

        const raw = window.localStorage.getItem(ChpViewerComponent.ZOOM_STORAGE_KEY);
        if (!raw) {
            return 16;
        }

        const parsed = Number(raw);
        if (Number.isNaN(parsed)) {
            return 16;
        }

        return this.clampZoom(parsed);
    }

    private saveZoom(value: number): void {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem(ChpViewerComponent.ZOOM_STORAGE_KEY, String(value));
    }

    private clampZoom(value: number): number {
        return Math.min(ChpViewerComponent.MAX_ZOOM, Math.max(ChpViewerComponent.MIN_ZOOM, value));
    }

    private clampPagedColumnWidth(value: number): number {
        const parsed = Number(value);
        if (Number.isNaN(parsed)) {
            return ChpViewerComponent.MIN_PAGED_COLUMN_WIDTH;
        }

        return Math.max(ChpViewerComponent.MIN_PAGED_COLUMN_WIDTH, parsed);
    }

    private clampColumnsPerPage(value: number): number {
        const parsed = Number(value);
        if (Number.isNaN(parsed)) {
            return 1;
        }

        return Math.max(1, Math.min(2, parsed));
    }

    private emitPageInfo(): void {
        if (!this.contentElement || !this.isPagedColumnsMode) {
            this.pageInfoChange.emit({ current: 1, total: 1 });
            return;
        }

        const viewportWidth = Math.max(1, this.contentElement.clientWidth);
        const total = Math.max(1, Math.ceil(this.contentElement.scrollWidth / viewportWidth));
        const current = Math.min(total, Math.max(1, Math.round(this.contentElement.scrollLeft / viewportWidth) + 1));
        this.pageInfoChange.emit({ current, total });
    }
}
