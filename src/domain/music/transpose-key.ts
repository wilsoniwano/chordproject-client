const pitchClassMap: Record<string, number> = {
    C: 0,
    'C#': 1,
    D: 2,
    Eb: 3,
    E: 4,
    F: 5,
    'F#': 6,
    G: 7,
    Ab: 8,
    A: 9,
    Bb: 10,
    B: 11,
    Cb: 11,
    'D#': 3,
    'E#': 5,
    Fb: 4,
    'G#': 8,
    'A#': 10,
    'B#': 0,
    Gb: 6,
    Db: 1,
};

const reversePitchClassMap: Record<number, string> = {
    0: 'C',
    1: 'C#',
    2: 'D',
    3: 'Eb',
    4: 'E',
    5: 'F',
    6: 'F#',
    7: 'G',
    8: 'Ab',
    9: 'A',
    10: 'Bb',
    11: 'B',
};

const chromaticKeyOrder = Object.values(reversePitchClassMap);

export function parseKey(input: string): { root: string; isMinor: boolean } {
    const isMinor = input.includes('m');
    const root = input.replace('m', '');
    return { root, isMinor };
}

export function normalizeMusicalKey(input: string): string {
    if (!input) {
        return input;
    }

    const { root, isMinor } = parseKey(input);
    if (pitchClassMap[root] === undefined) {
        return input;
    }

    return isMinor ? `${root}m` : root;
}

export function transposeMusicalKey(input: string, steps: number): string {
    const normalized = normalizeMusicalKey(input);
    const { root, isMinor } = parseKey(normalized);
    const pitchClass = pitchClassMap[root];

    if (pitchClass === undefined) {
        return normalized;
    }

    const newPitchClass = (pitchClass + steps + 12) % 12;
    const newKey = reversePitchClassMap[newPitchClass];
    return isMinor ? `${newKey}m` : newKey;
}

export function getAvailableMusicalKeys(input: string): string[] {
    const normalized = normalizeMusicalKey(input || 'C');
    const { isMinor } = parseKey(normalized);
    return chromaticKeyOrder.map((key) => (isMinor ? `${key}m` : key));
}
