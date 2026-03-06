import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TransposeKeyDialogComponent } from 'app/components/transpose-key-dialog/transpose-key-dialog.component';
import { PartialSong } from 'app/models/partialsong';

@Component({
    selector: 'chp-song-item',
    templateUrl: 'song-item.component.html',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, DragDropModule],
})
export class ChpSongItemComponent implements OnDestroy {
    @Input() song: PartialSong;
    @Input() ngClass: any;
    @Input() selected: boolean;
    @Input() showDragHandle = false;
    @Input() showToneControls = false;
    @Input() showRemoveButton = false;
    @Input() showExtendedMetaTags = false;
    @Output() keyChange = new EventEmitter<string>();
    @Output() removeRequested = new EventEmitter<Event>();

    constructor(private _dialog: MatDialog) {}

    get displayedKey(): string | null {
        return this.song?.customKey || this.song?.songKey || null;
    }

    get secondaryMetaLine(): string {
        if (!this.song) {
            return '';
        }

        const parts: string[] = [];

        if (this.song.artists?.length) {
            parts.push(this.song.artists.join(' - '));
        }

        if (this.showExtendedMetaTags) {
            if (this.song.songKey) {
                parts.push(`Tom: ${this.song.songKey}`);
            }

            if (typeof this.song.tempo === 'number') {
                parts.push(`Tempo: ${this.song.tempo}`);
            }
        }

        return parts.join(' • ');
    }

    openTonePicker(event: Event): void {
        event.stopPropagation();

        const currentKey = this.displayedKey;
        if (!currentKey) {
            return;
        }

        const dialogRef = this._dialog.open(TransposeKeyDialogComponent, {
            width: '420px',
            maxWidth: '95vw',
            data: { currentKey },
        });

        dialogRef.afterClosed().subscribe((selectedKey: string | undefined) => {
            if (!selectedKey || selectedKey === currentKey) {
                return;
            }

            this.keyChange.emit(selectedKey);
        });
    }

    requestRemove(event: Event): void {
        event.stopPropagation();
        this.removeRequested.emit(event);
    }

    ngOnDestroy() {
        // Cleanup logic if needed
    }
}
