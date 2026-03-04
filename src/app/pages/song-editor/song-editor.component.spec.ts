// @vitest-environment jsdom
import '@angular/compiler';
import { of } from 'rxjs';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('SongEditorComponent', () => {
    let SongEditorComponentClass: any;
    let changeDetectorRef: any;
    let viewContainerRef: any;
    let songService: any;
    let editorService: any;
    let route: any;
    let router: any;
    let component: any;

    beforeAll(async () => {
        (globalThis as any).self = globalThis;
        const module = await import('./song-editor.component');
        SongEditorComponentClass = module.SongEditorComponent;
    });

    beforeEach(() => {
        changeDetectorRef = {
            markForCheck: vi.fn(),
            detectChanges: vi.fn(),
        };
        viewContainerRef = { clear: vi.fn() };
        songService = { save: vi.fn() };
        editorService = { prepareSongFromContent: vi.fn() };
        route = { paramMap: of(new Map()) };
        router = { navigate: vi.fn().mockResolvedValue(true) };

        component = new SongEditorComponentClass(
            changeDetectorRef,
            viewContainerRef,
            songService,
            editorService,
            route,
            router
        );
    });

    it('redirects to library after successful save', async () => {
        component.song = { title: 'Teste', content: '{title: Teste}' } as any;
        editorService.prepareSongFromContent.mockReturnValue({ title: 'Teste' });
        songService.save.mockResolvedValue('song-123');

        await component.saveSong();

        expect(songService.save).toHaveBeenCalled();
        expect(component.song.uid).toBe('song-123');
        expect(router.navigate).toHaveBeenCalledWith(['/library']);
    });

    it('keeps user on editor when save fails', async () => {
        component.song = { title: 'Teste', content: '{title: Teste}' } as any;
        editorService.prepareSongFromContent.mockReturnValue({ title: 'Teste' });
        songService.save.mockResolvedValue(null);

        await component.saveSong();

        expect(router.navigate).not.toHaveBeenCalled();
        expect(changeDetectorRef.markForCheck).toHaveBeenCalled();
    });
});
