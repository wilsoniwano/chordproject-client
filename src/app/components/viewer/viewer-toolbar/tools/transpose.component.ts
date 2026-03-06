import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TransposeKeyDialogComponent } from 'app/components/transpose-key-dialog/transpose-key-dialog.component';
import { normalizeMusicalKey } from 'domain/music/transpose-key';

@Component({
    selector: 'chp-transpose-tool',
    standalone: true,
    templateUrl: './transpose.component.html',
    imports: [MatButtonModule, MatTooltipModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransposeToolComponent {
    @Input() isMobile = true;
    @Output() transposeEvent = new EventEmitter<string>();

    private _isMinorKey: boolean;

    private _initialKey: string;
    currentKey: string;

    constructor(private _dialog: MatDialog) {}

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

    openTonePicker(): void {
        const dialogRef = this._dialog.open(TransposeKeyDialogComponent, {
            width: '420px',
            maxWidth: '95vw',
            data: { currentKey: this.currentKey || this._initialKey || 'C' },
        });

        dialogRef.afterClosed().subscribe((selectedKey: string | undefined) => {
            if (!selectedKey || selectedKey === this.currentKey) {
                return;
            }

            this.currentKey = selectedKey;
            this.transposeEvent.emit(this.currentKey);
        });
    }

    private _updateKeyDisplayAndEmit(): void {
        this.transposeEvent.emit(this.currentKey);
    }
}
