import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { getAvailableMusicalKeys, normalizeMusicalKey } from 'domain/music/transpose-key';

type TransposeKeyDialogData = {
    currentKey: string;
};

@Component({
    selector: 'chp-transpose-key-dialog',
    standalone: true,
    templateUrl: './transpose-key-dialog.component.html',
    imports: [CommonModule, MatDialogModule, MatButtonModule],
    styles: [
        `
            .tone-grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 0.5rem;
            }

            @media (min-width: 640px) {
                .tone-grid {
                    grid-template-columns: repeat(6, minmax(0, 1fr));
                }
            }

            .tone-option {
                width: 100%;
                min-width: 0;
                height: 36px;
                line-height: 36px;
                padding: 0;
                position: relative;
                z-index: 0;
            }

            .tone-option.tone-option--selected {
                color: #fff !important;
            }
        `,
    ],
})
export class TransposeKeyDialogComponent {
    readonly data = inject<TransposeKeyDialogData>(MAT_DIALOG_DATA);
    private readonly _dialogRef = inject(MatDialogRef<TransposeKeyDialogComponent, string>);
    readonly currentKey = normalizeMusicalKey(this.data?.currentKey || 'C');
    readonly availableKeys = getAvailableMusicalKeys(this.currentKey);

    choose(key: string): void {
        this._dialogRef.close(key);
    }
}
