export function shouldCloseSearchOnEscape(appearance: 'basic' | 'bar', isAutocompleteOpen: boolean): boolean {
    return appearance === 'bar' && !isAutocompleteOpen;
}

export function shouldOpenSearch(opened: boolean): boolean {
    return !opened;
}

export function shouldCloseSearch(opened: boolean): boolean {
    return opened;
}

