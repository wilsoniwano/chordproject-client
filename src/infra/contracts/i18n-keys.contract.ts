import fs from 'node:fs';
import path from 'node:path';

export function flattenObjectKeys(value: unknown, prefix = ''): string[] {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return prefix ? [prefix] : [];
    }

    const entries = Object.entries(value as Record<string, unknown>);
    const keys: string[] = [];

    for (const [key, nested] of entries) {
        const nextPrefix = prefix ? `${prefix}.${key}` : key;
        const nestedKeys = flattenObjectKeys(nested, nextPrefix);
        if (nestedKeys.length === 0) {
            keys.push(nextPrefix);
        } else {
            keys.push(...nestedKeys);
        }
    }

    return keys;
}

export function readI18nFile(locale: string): Record<string, unknown> {
    const filePath = path.resolve(process.cwd(), 'public', 'chp', 'i18n', `${locale}.json`);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function getI18nLeafKeys(locale: string): string[] {
    const data = readI18nFile(locale);
    return flattenObjectKeys(data).sort();
}

export function diffKeySets(baseKeys: string[], targetKeys: string[]): { missing: string[]; extra: string[] } {
    const base = new Set(baseKeys);
    const target = new Set(targetKeys);

    const missing = [...base].filter((key) => !target.has(key)).sort();
    const extra = [...target].filter((key) => !base.has(key)).sort();

    return { missing, extra };
}

export function diffLocaleKeys(baseLocale: string, targetLocale: string): { missing: string[]; extra: string[] } {
    return diffKeySets(getI18nLeafKeys(baseLocale), getI18nLeafKeys(targetLocale));
}
