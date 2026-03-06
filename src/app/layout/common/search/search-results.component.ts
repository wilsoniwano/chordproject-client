import { Component, Input, ViewChild } from '@angular/core';
import { MatAutocomplete, MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'search-results',
    templateUrl: './search-results.component.html',
    standalone: true,
    imports: [MatAutocompleteModule, RouterModule, MatOptionModule, TranslocoModule],
})
export class SearchResultsComponent {
    @Input() resultSets: any;
    @Input() searchValue: string;
    @ViewChild('matAutocomplete') matAutocomplete: MatAutocomplete;

    highlightSearchTerm(text: string, searchTerm: string): string {
        if (!searchTerm) {
            return text;
        }
        const regex = new RegExp(searchTerm, 'gi');
        return text.replace(regex, '<mark>$&</mark>');
    }

    trackByUid(index: number, item: any): string {
        return item.uid;
    }

    getSongMetaLine(song: any): string {
        if (!song) {
            return '';
        }

        const parts: string[] = [];
        const artists = Array.isArray(song.artists) ? song.artists.filter(Boolean) : [];
        const key = song.customKey || song.songKey;
        const tempo = typeof song.tempo === 'number' ? song.tempo : null;

        if (artists.length) {
            parts.push(artists.join(' - '));
        }

        if (key) {
            parts.push(`Tom: ${key}`);
        }

        if (tempo !== null) {
            parts.push(`Tempo: ${tempo}`);
        }

        return parts.join(' • ');
    }
}
