import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { transposeMusicalKey } from 'domain/music/transpose-key';
import { PartialSong } from 'app/models/partialsong';

@Component({
    selector: 'chp-song-item',
    templateUrl: 'song-item.component.html',
    standalone: true,
    imports: [CommonModule, MatIconModule, DragDropModule],
})
export class ChpSongItemComponent implements OnDestroy {
    @Input() song: PartialSong;
    @Input() ngClass: any;
    @Input() selected: boolean;
    @Input() showDragHandle = false;
    @Input() showToneControls = false;
    @Output() keyChange = new EventEmitter<string>();

    get displayedKey(): string | null {
        return this.song?.customKey || this.song?.songKey || null;
    }

    transpose(step: number, event: Event): void {
        event.stopPropagation();

        const currentKey = this.displayedKey;
        if (!currentKey) {
            return;
        }

        const nextKey = transposeMusicalKey(currentKey, step);
        this.keyChange.emit(nextKey);
    }

    ngOnDestroy() {
        // Cleanup logic if needed
    }
}
