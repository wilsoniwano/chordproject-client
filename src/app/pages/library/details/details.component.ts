import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawerToggleResult } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { ChpViewerComponent } from 'app/components/viewer/viewer/viewer.component';
import { SongService } from 'app/core/firebase/api/song.service';
import { Song } from 'app/models/song';
import { Subject, takeUntil } from 'rxjs';
import { LibraryComponent } from '../library.component';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'songs-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatButtonModule,
        MatTooltipModule,
        RouterLink,
        MatIconModule,
        ChpViewerComponent,
        TranslocoModule,
    ],
})
export class SongsDetailsComponent implements OnInit, OnDestroy {
    song: Song;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _libraryComponent: LibraryComponent,
        private _songsService: SongService,
        private _router: Router
    ) {}

    ngOnInit(): void {
        // Open only when needed
        if (!this._libraryComponent.matDrawer.opened) {
            this._libraryComponent.matDrawer.open();
        }

        // Get the song
        this._songsService.song$.pipe(takeUntil(this._unsubscribeAll)).subscribe((song: Song) => {
            if (!this._libraryComponent.matDrawer.opened) {
                this._libraryComponent.matDrawer.open();
            }
            this.song = song;
            // Mark for check
            this._changeDetectorRef.markForCheck();
        });

    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    closeDrawer(): Promise<MatDrawerToggleResult> {
        return this._libraryComponent.matDrawer.close();
    }

    openFullEditor(): void {
        if (this.song?.uid) {
            this._router.navigate(['/songs/create', this.song.uid], {
                queryParams: {
                    returnTo: `/library/(drawer:${this.song.uid})`,
                },
            });
        }
    }
}
