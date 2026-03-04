import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { SongbookService } from 'app/core/firebase/api/songbook.service';
import { Songbook } from 'app/models/songbook';

@Component({
    selector: 'songbook-create',
    standalone: true,
    templateUrl: './songbook-create.component.html',
    imports: [
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        RouterLink,
        TranslocoModule,
    ],
})
export class SongbookCreateComponent {
    saving = false;

    readonly form = this._formBuilder.group({
        name: ['', [Validators.required, Validators.maxLength(80)]],
    });

    constructor(
        private _formBuilder: FormBuilder,
        private _songbookService: SongbookService,
        private _router: Router
    ) {}

    async save(): Promise<void> {
        if (this.form.invalid || this.saving) {
            this.form.markAllAsTouched();
            return;
        }

        const value = this.form.getRawValue();
        const songbook = {
            name: (value.name || '').trim(),
            parent: '',
            isReorderable: true,
            badgeText: '',
            order: '',
        } as Songbook;

        this.saving = true;
        const uid = await this._songbookService.save(songbook);
        this.saving = false;

        if (uid) {
            await this._router.navigate(['/songbook', uid]);
        }
    }
}
