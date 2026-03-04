import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'chp-zoom-tool',
    standalone: true,
    templateUrl: './zoom.component.html',
    imports: [CommonModule, MatButtonModule, MatIconModule, MatSliderModule, MatTooltipModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoomToolComponent implements OnInit {
    private static readonly ZOOM_STORAGE_KEY = 'chp.viewer.fontSize';
    private static readonly DEFAULT_ZOOM = 16;
    private static readonly MIN_ZOOM = 8;
    private static readonly MAX_ZOOM = 24;

    @Input() isMobile = true;
    @Output() zoomEvent = new EventEmitter<number>();
    showSizeSlider = false;
    fontSize = ZoomToolComponent.DEFAULT_ZOOM;

    ngOnInit(): void {
        if (typeof window === 'undefined') {
            return;
        }

        const raw = window.localStorage.getItem(ZoomToolComponent.ZOOM_STORAGE_KEY);
        if (!raw) {
            return;
        }

        const parsed = Number(raw);
        if (!Number.isNaN(parsed)) {
            this.fontSize = this.clamp(parsed);
        }
    }

    toggleSizeSlider(): void {
        this.showSizeSlider = !this.showSizeSlider;
    }

    onZoomEvent(size: number): void {
        this.fontSize = this.clamp(size);
        this.zoomEvent.emit(this.fontSize);
    }

    resetZoom(): void {
        this.fontSize = ZoomToolComponent.DEFAULT_ZOOM;
        this.zoomEvent.emit(this.fontSize);
    }

    private clamp(value: number): number {
        return Math.min(ZoomToolComponent.MAX_ZOOM, Math.max(ZoomToolComponent.MIN_ZOOM, value));
    }
}
