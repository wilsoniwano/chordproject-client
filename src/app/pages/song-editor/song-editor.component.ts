import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewContainerRef,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { ChpEditorComponent } from 'app/components/editor/editor/editor.component';
import { ChpSplitLayoutComponent } from 'app/components/split-layout/split-layout.component';
import { ChpViewerComponent } from 'app/components/viewer/viewer/viewer.component';
import { EditorService } from 'app/core/chordpro/editor.service';
import { SongService } from 'app/core/firebase/api/song.service';
import { Song } from 'app/models/song';
import { Subject, switchMap, takeUntil } from 'rxjs';

@Component({
    selector: 'song-editor',
    standalone: true,
    templateUrl: './song-editor.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatCardModule, ChpSplitLayoutComponent, ChpViewerComponent, ChpEditorComponent],
})
export class SongEditorComponent implements OnInit, OnDestroy {
    song: Song = new Song();
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _viewContainerRef: ViewContainerRef,
        private _songService: SongService,
        private _editorService: EditorService,
        private _route: ActivatedRoute,
        private _router: Router
    ) {}

    ngOnInit(): void {
        // Siempre limpiar las referencias
        this.cleanupTemplateRefs();
        this.loadSong();
    }

    private loadSong(): void {
        this._route.paramMap
            .pipe(
                takeUntil(this._unsubscribeAll),
                switchMap((params) => {
                    const uid = params.get('uid');
                    if (uid) {
                        return this._songService.get(uid);
                    }
                    return [];
                })
            )
            .subscribe((data) => {
                if (data) {
                    this.song = data;
                    this._changeDetectorRef.markForCheck();
                }
            });
    }

    // Evita el error de editor no visible si viene desde el editor de la librería
    private cleanupTemplateRefs(): void {
        const editors = document.querySelectorAll('chp-editor');

        if (editors.length > 0) {
            this._viewContainerRef.clear();

            editors.forEach((editor) => {
                const parent = editor.parentElement;
                if (parent) parent.removeChild(editor);
            });

            setTimeout(() => {
                this._changeDetectorRef.detectChanges();
            }, 50);
        }
    }

    async saveSong(): Promise<void> {
        const updatedSong = this._editorService.prepareSongFromContent(this.song.content);
        this.song = { ...this.song, ...updatedSong };
        const res = await this._songService.save(this.song);

        if (res) {
            this.song.uid = res;
            const returnTo = this._route.snapshot?.queryParamMap?.get?.('returnTo');
            if (returnTo) {
                await this._router.navigateByUrl(returnTo);
                return;
            }
            await this._router.navigate(['/library']);
            return;
        }

        this._changeDetectorRef.markForCheck();
    }

    removeSong(): void {
        this._editorService.confirmAndDelete(this.song).subscribe((success) => {
            if (success) {
                this._router.navigate(['/library']);
            }
            this._changeDetectorRef.markForCheck();
        });
    }

    showHelp(): void {
        // Implement help functionality
    }

    onEditorClose() {
        const returnTo = this._route.snapshot?.queryParamMap?.get?.('returnTo');
        if (returnTo) {
            this._router.navigateByUrl(returnTo);
            return;
        }

        if (this.song?.uid) {
            this._router.navigate(['/songs/read', this.song.uid]);
            return;
        }

        this._router.navigate(['/library']);
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}
