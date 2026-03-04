export function normalizeText(value: string | null | undefined): string {
    return (value || '')
        .toLocaleLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

