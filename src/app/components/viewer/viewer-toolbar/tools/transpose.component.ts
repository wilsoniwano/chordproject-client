import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { normalizeMusicalKey, transposeMusicalKey } from 'domain/music/transpose-key';

@Component({
    selector: 'chp-transpose-tool',
    standalone: true,
    templateUrl: './transpose.component.html',
    imports: [MatButtonModule, MatIconModule, MatTooltipModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransposeToolComponent {
    @Input() isMobile = true;
    @Output() transposeEvent = new EventEmitter<string>();

    private _isMinorKey: boolean;

    private _initialKey: string;
    currentKey: string;

    @Input()
    set initialKey(value: string) {
        if (!value) return;
        const normalized = normalizeMusicalKey(value);
        this._isMinorKey = normalized.includes('m');
        this._initialKey = normalized;
        this.currentKey = this._initialKey;
        this._updateKeyDisplayAndEmit(); // Emitir evento al inicializar
    }
    get initialKey(): string {
        return this._initialKey;
    }

    transposeUp(): void {
        this.currentKey = transposeMusicalKey(this.currentKey, 1);
        this.transposeEvent.emit(this.currentKey);
    }

    transposeDown(): void {
        this.currentKey = transposeMusicalKey(this.currentKey, -1);
        this.transposeEvent.emit(this.currentKey);
    }

    private _updateKeyDisplayAndEmit(): void {
        this.transposeEvent.emit(this.currentKey);
    }
}
