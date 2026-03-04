import { SearchResultSets } from 'app/models/searchResultSets';

export function isValidSearchResultSets(value: unknown): value is SearchResultSets {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const candidate = value as Record<string, unknown>;

    return (
        Array.isArray(candidate.songs) &&
        Array.isArray(candidate.songbooks) &&
        Array.isArray(candidate.songsInSongbooks) &&
        (candidate.songsContent === undefined || Array.isArray(candidate.songsContent))
    );
}

