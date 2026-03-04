import { PartialSong } from 'app/models/partialsong';
import { Songbook } from 'app/models/songbook';
import { normalizeText } from 'domain/text/normalize-text';

export function filterSongsByTitle(songs: PartialSong[], searchTerm?: string): PartialSong[] {
    if (!searchTerm) {
        return songs;
    }

    const query = normalizeText(searchTerm);
    return songs.filter((song) => !!song.title && normalizeText(song.title).includes(query));
}

export function filterSongsByLyrics(songs: PartialSong[], searchTerm?: string): PartialSong[] {
    if (!searchTerm) {
        return songs;
    }

    const query = normalizeText(searchTerm);
    return songs.filter((song) => !!song.lyrics && normalizeText(song.lyrics).includes(query));
}

export function sortSongsByTitle(songs: PartialSong[]): PartialSong[] {
    return [...songs].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'es', { sensitivity: 'base' }));
}

export function addNormalizedInitial(songs: PartialSong[]): PartialSong[] {
    return songs.map((song) => ({
        ...song,
        normalizedInitial: song.title
            ? song.title.trim().charAt(0).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
            : '',
    }));
}

export function filterSongbooksByName(songbooks: Songbook[], searchTerm?: string): Songbook[] {
    if (!searchTerm) {
        return songbooks;
    }

    const query = normalizeText(searchTerm);
    return songbooks.filter((sb) => normalizeText(sb.name).includes(query));
}

export function sortSongbooksByName(songbooks: Songbook[]): Songbook[] {
    return [...songbooks].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' }));
}

export function sortSongbooksByEventDateDesc(songbooks: Songbook[]): Songbook[] {
    const toTime = (eventDate?: string): number => {
        if (!eventDate) {
            return Number.NEGATIVE_INFINITY;
        }

        const [year, month, day] = eventDate.split('-').map(Number);
        if (!year || !month || !day) {
            return Number.NEGATIVE_INFINITY;
        }

        return Date.UTC(year, month - 1, day);
    };

    return [...songbooks].sort((a, b) => toTime(b.eventDate) - toTime(a.eventDate));
}

export function limitItems<T>(items: T[], limit?: number): T[] {
    if (!limit) {
        return items;
    }

    return items.slice(0, limit);
}
