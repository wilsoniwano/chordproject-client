import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Songbook viewer template contract', () => {
    const templatePath = join(process.cwd(), 'src/app/pages/songbook/songbook-viewer.component.html');
    const template = readFileSync(templatePath, 'utf-8');

    it('keeps drawer dimensions constrained to viewport', () => {
        expect(template).toContain('h-screen max-h-screen');
        expect(template).toContain('w-[min(92vw,24rem)]');
    });

    it('uses high-contrast active state classes', () => {
        expect(template).toContain('!bg-primary');
        expect(template).toContain('!text-white');
        expect(template).toContain('!border-primary');
    });

    it('keeps tone picker button and fixed-width font badge', () => {
        expect(template).toContain('tone-key-button font-mono');
        expect(template).toContain('inline-flex w-16 justify-center');
    });
});
