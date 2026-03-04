import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    addNormalizedInitial,
    filterSongsByLyrics,
    filterSongsByTitle,
    limitItems,
    sortSongsByTitle,
} from 'domain/search/search-index';
import { UserService } from 'app/core/user/user.service';
import { PartialSong } from 'app/models/partialsong';
import { Song } from 'app/models/song';
import { environment } from 'environments/environment';
import {
    Firestore,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where,
} from 'firebase/firestore';
import { BehaviorSubject, Observable, Subject, combineLatest, firstValueFrom, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FirebaseService } from '../firebase.service';

@Injectable({
    providedIn: 'root',
})
export class SongService {
    private _firestore: Firestore;
    private _snackBar: MatSnackBar;
    private _userService: UserService;
    private _song: BehaviorSubject<Song | null> = new BehaviorSubject(null);
    private _songsChanged = new Subject<void>();
    private _mockMode = this._isMockModeEnabled();

    get song$(): Observable<Song> {
        return this._song.asObservable();
    }

    get songsChanged$(): Observable<void> {
        return this._songsChanged.asObservable();
    }

    constructor() {
        const firebase = inject(FirebaseService);
        this._firestore = firebase.firestore;
        this._snackBar = inject(MatSnackBar);
        this._userService = inject(UserService);
    }

    get(id: string): Observable<Song> {
        if (this._mockMode) {
            const songs = this._readMockSongs();
            const found = songs.find((song) => song.uid === id);

            if (!found) {
                return throwError(() => new Error(`Song with ID ${id} not found`));
            }

            const song = found as Song;
            this._song.next(song);
            return from([song]);
        }

        return from(getDoc(doc(this._firestore, 'songs', id))).pipe(
            map((docSnap) => {
                if (docSnap.exists()) {
                    const song = docSnap.data() as Song;
                    this._song.next(song);
                    return song;
                } else {
                    throw new Error(`Song with ID ${id} not found`);
                }
            }),
            catchError((error) => this.handleError(error))
        );
    }

    getAll(ids: string[]): Observable<PartialSong[]> {
        if (!ids || ids.length === 0) {
            return from([[]]);
        }

        if (this._mockMode) {
            const songs = this._readMockSongs();
            return from([songs.filter((song) => ids.includes(song.uid))]);
        }

        const chunkSize = 30;
        const idChunks = Array.from({ length: Math.ceil(ids.length / chunkSize) }, (_, i) =>
            ids.slice(i * chunkSize, (i + 1) * chunkSize)
        );

        const observables = idChunks.map((chunk) => {
            return from(getDocs(query(collection(this._firestore, 'songs'), where('uid', 'in', chunk)))).pipe(
                map((snapshot) => snapshot.docs.map((doc) => doc.data() as PartialSong))
            );
        });

        return combineLatest(observables).pipe(
            map((results) => results.flat()),
            catchError((error) => this.handleError(error))
        );
    }

    searchByTitle(searchTerm?: string, limitResults?: number): Observable<PartialSong[]> {
        if (this._mockMode) {
            const songs = this._readMockSongs();
            const filtered = filterSongsByTitle(songs, searchTerm);
            const sorted = sortSongsByTitle(filtered);
            const withInitial = addNormalizedInitial(sorted);
            return from([limitItems(withInitial, limitResults)]);
        }

        const songsRef = collection(this._firestore, 'songs');
        const q = query(songsRef, orderBy('title'));
        return from(getDocs(q)).pipe(
            map((snapshot) => {
                const songs = snapshot.docs.map((doc) => doc.data() as PartialSong);
                const filtered = filterSongsByTitle(songs, searchTerm);
                const sorted = sortSongsByTitle(filtered);
                const withInitial = addNormalizedInitial(sorted);
                return limitItems(withInitial, limitResults);
            }),
            catchError((error) => this.handleError(error))
        );
    }

    searchByLyrics(searchTerm?: string, limitResults?: number): Observable<PartialSong[]> {
        if (this._mockMode) {
            const songs = this._readMockSongs();
            const filtered = filterSongsByLyrics(songs, searchTerm);
            const sorted = sortSongsByTitle(filtered);
            return from([limitItems(sorted, limitResults)]);
        }

        const songsRef = collection(this._firestore, 'songs');
        const q = query(songsRef, orderBy('title'));
        return from(getDocs(q)).pipe(
            map((snapshot) => {
                const songs = snapshot.docs.map((doc) => doc.data() as PartialSong);
                const filtered = filterSongsByLyrics(songs, searchTerm);
                const sorted = sortSongsByTitle(filtered);
                return limitItems(sorted, limitResults);
            }),
            catchError((error) => this.handleError(error))
        );
    }

    getLatest(pageSize: number = 10): Observable<PartialSong[]> {
        if (this._mockMode) {
            const songs = this._readMockSongs();
            const ordered = [...songs].sort((a, b) => {
                const left = new Date((a as any).creationDate || 0).getTime();
                const right = new Date((b as any).creationDate || 0).getTime();
                return right - left;
            });
            return from([ordered.slice(0, pageSize)]);
        }

        const q = query(collection(this._firestore, 'songs'), orderBy('creationDate', 'desc'), limit(pageSize));

        return from(getDocs(q)).pipe(
            map((snapshot) => snapshot.docs.map((doc) => doc.data() as PartialSong)),
            catchError((error) => this.handleError(error))
        );
    }

    async save(song: Song): Promise<string> {
        if (!(await this.verifyAuthentication())) {
            return null;
        }

        if (!song.title) {
            this.showSnackbar('Title is required', 3000, 'warning');
            return null;
        }

        if (this._mockMode) {
            const songs = this._readMockSongs();
            const uid = song.uid || `song-${Date.now()}`;
            const nextSong = {
                ...song,
                uid,
                creationDate: (song as any).creationDate || new Date().toISOString(),
                authorId: (song as any).authorId || 'e2e-user-1',
                source: (song as any).source || 'e2e-mock',
            } as Song;

            const index = songs.findIndex((s) => s.uid === uid);
            if (index >= 0) {
                songs[index] = nextSong;
            } else {
                songs.push(nextSong);
            }

            this._writeMockSongs(songs);
            this._song.next(nextSong);
            return uid;
        }

        try {
            const user = await firstValueFrom(this._userService.user$);
            const userUid = user?.uid;

            if (!song.uid) {
                song.uid = doc(collection(this._firestore, 'songs')).id;
                song.creationDate = serverTimestamp();
                song.source = environment.source;
                song.videoId = '';
            }

            song.authorId = userUid;

            await setDoc(doc(this._firestore, 'songs', song.uid), { ...song });
            this.showSnackbar('Song saved successfully');
            return song.uid;
        } catch (error) {
            this.handleError(error);
            return null;
        }
    }

    async delete(id: string): Promise<boolean> {
        if (!(await this.verifyAuthentication())) {
            return false;
        }

        if (this._mockMode) {
            const songs = this._readMockSongs().filter((song) => song.uid !== id);
            this._writeMockSongs(songs);
            this._songsChanged.next();
            return true;
        }

        try {
            await deleteDoc(doc(this._firestore, 'songs', id));
            this.showSnackbar('Song deleted successfully');
            this._songsChanged.next();
            return true;
        } catch (error) {
            this.handleError(error);
            return false;
        }
    }

    private async verifyAuthentication(): Promise<boolean> {
        if (this._mockMode) {
            if (typeof window === 'undefined') {
                return false;
            }

            const user = window.localStorage.getItem('e2e.mockAuth.user');
            return !!user;
        }

        const isAuthenticated = await firstValueFrom(this._userService.isAuthenticated());
        if (!isAuthenticated) {
            this.showSnackbar('Authentication required', 3000, 'warning');
            return false;
        }
        return true;
    }

    private showSnackbar(message: string, duration: number = 3000, type?: string): void {
        this._snackBar.open(message, 'Close', {
            duration,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: type ? [type] : [],
        });
    }

    private handleError(error: any): Observable<never> {
        console.error('Firebase service error:', error);
        let errorMessage = 'An unexpected error occurred';

        if (error.message) {
            errorMessage = error.message;
        }

        this.showSnackbar(errorMessage, 3000, 'error');
        return throwError(() => new Error(errorMessage));
    }

    getTags() {
        //TODO
        return null;
    }

    private _isMockModeEnabled(): boolean {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.localStorage.getItem('e2e.mockData') === '1';
    }

    private _readMockSongs(): Song[] {
        if (typeof window === 'undefined') {
            return [];
        }

        const raw = window.localStorage.getItem('e2e.mockSongs');
        if (!raw) {
            return [];
        }

        return JSON.parse(raw) as Song[];
    }

    private _writeMockSongs(songs: Song[]): void {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem('e2e.mockSongs', JSON.stringify(songs));
    }
}
