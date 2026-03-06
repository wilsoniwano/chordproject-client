/* eslint-disable @typescript-eslint/no-explicit-any */
import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  DOCUMENT
} from '@angular/core';
import { FuseConfigService } from '@fuse/services/config';
import * as ChordProjectEditor from 'chordproject-editor';
import { Subject, takeUntil } from 'rxjs';
import { ChpEditorToolbarComponent } from '../editor-toolbar/editor-toolbar.component';

@Component({
    selector: 'chp-editor',
    templateUrl: './editor.component.html',
    imports: [ChpEditorToolbarComponent],
})
export class ChpEditorComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
    @Output() contentChange = new EventEmitter<string>();
    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<void>();
    @Output() remove = new EventEmitter<void>();
    @Output() openFullEditor = new EventEmitter<void>();
    @Output() help = new EventEmitter<void>();

    @Input() style: any = {};
    @Input() mode: 'quick' | 'full' = 'full';
    @Input() forceLightTheme = false;

    @ViewChild('editorDiv', { static: true }) editorDiv!: ElementRef;

    _autoUpdateContent = true;
    _editor: any;
    _durationBeforeCallback = 0;
    _content = '';
    songTitle = '';
    songArtist = '';
    oldContent: any;
    timeoutSaving: any;
    isDarkMode: boolean = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _fuseConfigService: FuseConfigService,
        @Inject(DOCUMENT) private _document: Document,
        @Inject(PLATFORM_ID) private _platformId: Object
    ) {
        // Check initial dark mode state immediately
        if (isPlatformBrowser(this._platformId)) {
            this.isDarkMode = this._document.body.classList.contains('dark');
        }
    }

    ngOnInit(): void {
        // Subscribe to config changes to detect theme changes
        this._fuseConfigService.config$.pipe(takeUntil(this._unsubscribeAll)).subscribe((config) => {
            // Update darkTheme based on the current scheme and body class
            let newDarkTheme = config.scheme === 'dark';

            // For auto scheme, check the actual body class
            if (config.scheme === 'auto' && isPlatformBrowser(this._platformId)) {
                newDarkTheme = this._document.body.classList.contains('dark');
            }

            // Only call themeChanged if the theme actually changed
            if (this.isDarkMode !== newDarkTheme) {
                this.isDarkMode = newDarkTheme;
                this.themeChanged();
            }
        });
    }

    ngAfterViewInit(): void {
        // Inicializar el editor inmediatamente cuando el componente se monte
        this.initEditor();

        // Si ya hay contenido, aplicarlo
        if (this._content) {
            // Dar un pequeño tiempo para que el editor se monte completamente
            setTimeout(() => {
                this.setEditorContent(this._content);
            }, 100);
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['content']) {
            const newContent = changes['content'].currentValue;
            if (this._editor && newContent !== undefined) {
                this.setEditorContent(newContent);
            }
        }
        if (changes['forceLightTheme'] && this._editor) {
            this.themeChanged();
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    initEditor(): void {
        if (this._editor) {
            return; // El editor ya está inicializado
        }

        try {
            // Inicializar el editor con el elemento DOM
            ChordProjectEditor.Main.init(this.editorDiv.nativeElement);
            this._editor = ChordProjectEditor.Main.getEditor();

            // Configurar eventos
            this._editor.on('change', () => this.updateContent());
            this._editor.on('paste', () => this.updateContent());

            // Aplicar el tema actual
            this.themeChanged();

            setTimeout(() => {
                const input = this.editorDiv.nativeElement.querySelector('textarea, [contenteditable="true"]');
                if (input) {
                    (input as HTMLElement).focus();
                }
            }, 0);
        } catch (error) {
            console.error('Error al inicializar el editor:', error);
        }
    }

    updateContent(): void {
        const newVal = this._editor.getValue();
        if (newVal === this.oldContent) {
            return;
        }
        this.updateSongHeaderFromContent(newVal);
        if (!this._durationBeforeCallback) {
            this._content = newVal;
            this.contentChange.emit(newVal);
        } else {
            if (this.timeoutSaving) {
                clearTimeout(this.timeoutSaving);
            }

            this.timeoutSaving = setTimeout(() => {
                this._content = newVal;
                this.contentChange.emit(newVal);
                this.timeoutSaving = null;
            }, this._durationBeforeCallback);
        }
        this.oldContent = newVal;
    }

    get content(): string {
        return this._content;
    }

    @Input()
    set content(content: string) {
        const normalizedContent = content ?? '';
        this._content = normalizedContent;
        this.updateSongHeaderFromContent(normalizedContent);

        // Evita resetar o cursor quando o conteúdo veio do próprio editor
        if (this._editor) {
            const currentEditorContent = this._editor.getValue?.() ?? '';
            if (currentEditorContent !== normalizedContent) {
                this.setEditorContent(normalizedContent);
            }
        }
        // Si no, el contenido se aplicará en ngAfterViewInit
    }

    setContent(content: string): void {
        if (content === null || content === undefined) {
            content = '';
        }
        if (this._editor && this._content !== content && this._autoUpdateContent === true) {
            this._content = content;
            this.updateSongHeaderFromContent(content);
            this._editor.setValue(content);
            this._editor.clearSelection();
            this._editor.resize(true);
        }
    }

    setEditorContent(value: string): void {
        if (!this._editor) {
            console.warn('Editor no inicializado. Contenido no aplicado:', value);
            this._content = value || '';
            return;
        }

        try {
            const nextContent = value || '';
            const currentEditorContent = this._editor.getValue?.() ?? '';

            if (currentEditorContent === nextContent) {
                return;
            }

            this.updateSongHeaderFromContent(nextContent);
            this._editor.setValue(nextContent);
            this._editor.clearSelection();
            this._editor.resize(true);
        } catch (error) {
            console.error('Error al establecer el contenido en el editor:', error);
        }
    }

    @Input()
    set autoUpdateContent(status: boolean) {
        this.setAutoUpdateContent(status);
    }

    setAutoUpdateContent(status: boolean): void {
        this._autoUpdateContent = status;
    }

    @Input()
    set durationBeforeCallback(num: number) {
        this.setDurationBeforeCallback(num);
    }

    setDurationBeforeCallback(num: number): void {
        this._durationBeforeCallback = num;
    }

    getEditor(): any {
        return this._editor;
    }

    themeChanged(): void {
        if (!this._editor) {
            return; // Skip if editor is not initialized yet
        }

        if (this.forceLightTheme) {
            ChordProjectEditor.Main.doSetTheme('default');
            return;
        }

        let theme = 'default';
        if (this.isDarkMode) {
            theme = 'dark';
        }

        ChordProjectEditor.Main.doSetTheme(theme);
    }

    onClose() {
        this.close.emit();
    }
    onSave() {
        this.save.emit();
    }
    onRemove() {
        this.remove.emit();
    }
    onOpenFullEditor() {
        this.openFullEditor.emit();
    }
    onHelp() {
        this.help.emit();
    }

    private updateSongHeaderFromContent(content: string): void {
        this.songTitle = this.extractChordProTag(content, ['title', 't']);
        this.songArtist = this.extractChordProTag(content, ['artist']);
    }

    private extractChordProTag(content: string, tags: string[]): string {
        if (!content) {
            return '';
        }

        for (const tag of tags) {
            const regex = new RegExp(`\\{\\s*${tag}\\s*:\\s*([^}]+)\\}`, 'i');
            const match = regex.exec(content);
            if (match?.[1]) {
                return match[1].trim();
            }
        }

        return '';
    }
}
