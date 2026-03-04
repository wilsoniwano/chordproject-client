import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { SongbookService } from 'app/core/firebase/api/songbook.service';

@Component({
    selector: 'songbook-list',
    standalone: true,
    templateUrl: './songbook-list.component.html',
    imports: [AsyncPipe, MatCardModule, MatButtonModule, RouterLink, TranslocoModule],
})
export class SongbookListComponent {
    readonly songbooks$ = this._songbookService.getAll();

    constructor(private _songbookService: SongbookService) {}
}
