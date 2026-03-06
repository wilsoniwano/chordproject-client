import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    finalizeSongbookSearchGroups,
    limitSongbookSongsGroup,
    mergeUniqueSongMatchesByUid,
} from 'application/songbook/songbook-search.usecase';
import { mapSongsWithRelations, sortSongsByRelationOrder } from 'application/songbook/songbook-content.usecase';
import {
    filterSongbooksByName,
    filterSongsByLyrics,
    filterSongsByTitle,
    limitItems,
    sortSongbooksByEventDateDesc,
    sortSongbooksByName,
} from 'domain/search/search-index';
import { ParserService } from 'app/core/chordpro/parser.service';
import { PartialSong } from 'app/models/partialsong';
import { Relation } from 'app/models/relation';
import { Songbook } from 'app/models/songbook';
import { Auth } from 'firebase/auth';
import {
    Firestore,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where,
    writeBatch,
} from 'firebase/firestore';
import { Observable, combineLatest, from, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { FirebaseService } from '../firebase.service';
import { SongService } from './song.service';

@Injectable({
    providedIn: 'root',
})
export class SongbookService {
    private _firestore: Firestore;
    private _auth: Auth;

    constructor(
        private _firebase: FirebaseService,
        private _snackBar: MatSnackBar,
        private _songService: SongService,
        private _parserService: ParserService
    ) {
        this._firestore = this._firebase.firestore;
        this._auth = this._firebase.auth;
    }

    get(id: string): Observable<Songbook> {
        return from(getDoc(doc(this._firestore, 'songbooks', id))).pipe(
            map((docSnap) => {
                if (docSnap.exists()) {
                    return { uid: docSnap.id, ...docSnap.data() } as Songbook;
                } else {
                    throw new Error(`Songbook with ID ${id} not found`);
                }
            }),
            catchError((error) => this.handleError(error))
        );
    }

    getAll(): Observable<Songbook[]> {
        const q = query(collection(this._firestore, 'songbooks'));

        return from(getDocs(q)).pipe(
            map((snapshot) =>
                sortSongbooksByEventDateDesc(
                    snapshot.docs.map(
                        (doc) =>
                            ({
                                uid: doc.id,
                                ...doc.data(),
                            }) as Songbook
                    )
                )
            ),
            catchError((error) => this.handleError(error))
        );
    }

    getByParent(parent: string): Observable<Songbook[]> {
        const q = query(
            collection(this._firestore, 'songbooks'),
            where('parent', '==', parent),
            orderBy('order'),
            orderBy('name')
        );

        return from(getDocs(q)).pipe(
            map((snapshot) =>
                snapshot.docs.map(
                    (doc) =>
                        ({
                            uid: doc.id,
                            ...doc.data(),
                        }) as Songbook
                )
            ),
            catchError((error) => this.handleError(error))
        );
    }

    getSongsCountBySongbookIds(songbookIds: string[]): Observable<Record<string, number>> {
        if (!songbookIds?.length) {
            return of({});
        }

        const chunkSize = 30;
        const chunks = Array.from({ length: Math.ceil(songbookIds.length / chunkSize) }, (_, index) =>
            songbookIds.slice(index * chunkSize, (index + 1) * chunkSize)
        );

        const chunkQueries = chunks.map((chunk) =>
            from(
                getDocs(
                    query(
                        collection(this._firestore, 'songbook_songs'),
                        where('songbookId', 'in', chunk)
                    )
                )
            ).pipe(
                map((snapshot) => {
                    const counts: Record<string, number> = {};
                    snapshot.docs.forEach((relationDoc) => {
                        const data = relationDoc.data() || {};
                        if (data.deleted === true) {
                            return;
                        }

                        const id = data.songbookId as string;
                        if (!id) {
                            return;
                        }
                        counts[id] = (counts[id] || 0) + 1;
                    });
                    return counts;
                })
            )
        );

        return combineLatest(chunkQueries).pipe(
            map((results) =>
                results.reduce((acc, partial) => {
                    Object.entries(partial).forEach(([songbookId, count]) => {
                        acc[songbookId] = (acc[songbookId] || 0) + count;
                    });
                    return acc;
                }, {} as Record<string, number>)
            ),
            catchError((error) => this.handleError(error))
        );
    }

    getContent(songbookId: string): Observable<PartialSong[]> {
        const relationsRef = collection(this._firestore, 'songbook_songs');
        const q = query(relationsRef, where('songbookId', '==', songbookId));

        return from(getDocs(q)).pipe(
            switchMap((relationsSnapshot) => {
                if (relationsSnapshot.empty) {
                    return of([]);
                }

                const relations = relationsSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    const relation = new Relation(data.songbookId, data.songId);

                    if (data.author_uid) {
                        relation.author_uid = data.author_uid;
                    }
                    if (data.order !== undefined) {
                        relation.order = data.order;
                    }
                    if (data.customKey !== undefined) {
                        relation.customKey = data.customKey;
                    }

                    return relation;
                });

                const songIds = relations.map((relation) => relation.songId);

                return this._songService.getAll(songIds).pipe(
                    map((songs) => {
                        const songsWithRelations = mapSongsWithRelations(songs, relations);
                        const adjustedSongs = songsWithRelations.map((song) => this.applySongbookCustomKey(song));
                        return sortSongsByRelationOrder(adjustedSongs);
                    })
                );
            }),
            catchError((error) => {
                console.error('Error fetching songbook content:', error);
                this.showSnackbar('Failed to load songbook content');
                return of([]);
            })
        );
    }

    async save(songbook: Songbook): Promise<string> {
        if (!this.verifyAuthentication()) {
            return null;
        }

        if (!songbook.name) {
            this.showSnackbar('Name is required');
            return null;
        }

        if (!songbook.eventDate) {
            this.showSnackbar('Event date is required');
            return null;
        }

        if (!(songbook.leaderName || '').trim()) {
            this.showSnackbar('Leader is required');
            return null;
        }

        try {
            const user = this._auth.currentUser;

            if (!songbook.uid) {
                songbook.uid = doc(collection(this._firestore, 'songbooks')).id;
                songbook.creationDate = serverTimestamp();
                songbook.source = 'homenajesus';
            }

            songbook.authorId = user.uid;

            await setDoc(doc(this._firestore, 'songbooks', songbook.uid), {
                ...songbook,
                leaderName: (songbook.leaderName || '').trim(),
            });
            this.showSnackbar('Songbook saved successfully');
            return songbook.uid;
        } catch (error) {
            this.handleError(error);
            return null;
        }
    }

    async delete(songbookId: string): Promise<boolean> {
        if (!this.verifyAuthentication()) {
            return false;
        }

        try {
            const relationsQuery = query(
                collection(this._firestore, 'songbook_songs'),
                where('songbookId', '==', songbookId)
            );
            const relationsSnapshot = await getDocs(relationsQuery);

            const batch = writeBatch(this._firestore);
            relationsSnapshot.docs.forEach((relationDoc) => {
                batch.delete(relationDoc.ref);
            });
            batch.delete(doc(this._firestore, 'songbooks', songbookId));

            await batch.commit();
            this.showSnackbar('Songbook deleted successfully');
            return true;
        } catch (error) {
            this.handleError(error);
            return false;
        }
    }

    async addSong(
        songbookId: string,
        songId: string,
        order?: number
    ): Promise<string> {
        if (!this.verifyAuthentication()) {
            return null;
        }

        try {
            const relationId = doc(
                collection(this._firestore, 'songbook_songs')
            ).id;

            const relation = new Relation(songbookId, songId);
            if (order !== undefined) {
                relation.order = order;
            }

            if (this._auth.currentUser) {
                relation.author_uid = this._auth.currentUser.uid;
            }

            const relationData = {
                songbookId: relation.songbookId,
                songId: relation.songId,
                author_uid: relation.author_uid,
                order: relation.order,
                customKey: relation.customKey ?? null,
            };

            await setDoc(
                doc(this._firestore, 'songbook_songs', relationId),
                relationData
            );
            this.showSnackbar('Song added to songbook');
            return relationId;
        } catch (error) {
            this.handleError(error);
            return null;
        }
    }

    async removeSong(songbookId: string, songId: string): Promise<boolean> {
        if (!this.verifyAuthentication()) {
            return false;
        }

        try {
            const q = query(
                collection(this._firestore, 'songbook_songs'),
                where('songbookId', '==', songbookId),
                where('songId', '==', songId)
            );

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                this.showSnackbar('Song not found in songbook');
                return false;
            }

            const relationDoc = snapshot.docs[0];
            await setDoc(
                doc(this._firestore, 'songbook_songs', relationDoc.id),
                {
                    deleted: true,
                    deletedAt: serverTimestamp(),
                },
                { merge: true }
            );

            this.showSnackbar('Song removed from songbook');
            return true;
        } catch (error) {
            this.handleError(error);
            return false;
        }
    }

    async updateSongCustomKey(songbookId: string, songId: string, customKey: string | null): Promise<boolean> {
        if (!this.verifyAuthentication()) {
            return false;
        }

        try {
            const q = query(
                collection(this._firestore, 'songbook_songs'),
                where('songbookId', '==', songbookId),
                where('songId', '==', songId)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                this.showSnackbar('Song not found in songbook');
                return false;
            }

            await setDoc(
                doc(this._firestore, 'songbook_songs', snapshot.docs[0].id),
                { customKey: customKey ?? null },
                { merge: true }
            );

            return true;
        } catch (error) {
            this.handleError(error);
            return false;
        }
    }

    updateSongOrder(
        songbookId: string,
        songOrders: { songId: string; order: number }[]
    ): Observable<boolean> {
        if (!this.verifyAuthentication()) {
            return of(false);
        }

        return from(
            (async () => {
                try {
                    const q = query(
                        collection(this._firestore, 'songbook_songs'),
                        where('songbookId', '==', songbookId)
                    );

                    const snapshot = await getDocs(q);

                    if (snapshot.empty) {
                        this.showSnackbar('No songs found in songbook');
                        return false;
                    }

                    const relationDocs = {};
                    snapshot.docs.forEach((doc) => {
                        const data = doc.data();
                        relationDocs[data.songId] = doc.id;
                    });

                    const batch = writeBatch(this._firestore);

                    for (const item of songOrders) {
                        if (relationDocs[item.songId]) {
                            const docRef = doc(
                                this._firestore,
                                'songbook_songs',
                                relationDocs[item.songId]
                            );
                            batch.update(docRef, { order: item.order });
                        }
                    }

                    await batch.commit();
                    return true;
                } catch (error) {
                    this.handleError(error);
                    return false;
                }
            })()
        );
    }

    searchSongbooks(
        searchTerm?: string,
        limitResults: number = 3
    ): Observable<Songbook[]> {
        const songbooksRef = collection(this._firebase.firestore, 'songbooks');
        const q = query(songbooksRef, orderBy('name'));
        return from(getDocs(q)).pipe(
            map((snapshot) => {
                const songbooks = snapshot.docs.map((doc) => {
                    const data = doc.data() || {};
                    return {
                        uid: data.uid,
                        name: data.name,
                    } as Songbook;
                });
                const filtered = filterSongbooksByName(songbooks, searchTerm);
                const sorted = sortSongbooksByName(filtered);
                return limitItems(sorted, limitResults);
            }),
            catchError((error) => this.handleError(error))
        );
    }

    searchSongsInSongbooks(
        searchTerm: string,
        limitSongbooks: number = 3,
        limitSongsPerSongbook: number = 3
    ): Observable<{ songbook: Songbook; songs: PartialSong[] }[]> {
        return this.getAll().pipe(
            switchMap((songbooks) => {
                if (!songbooks.length) return of([]);

                // Para cada cancionero, obtener sus canciones y filtrar por el término
                return combineLatest(
                    songbooks.map((songbook) =>
                        this.getContent(songbook.uid).pipe(
                            map((songs) => {
                                const byTitle = filterSongsByTitle(songs, searchTerm);
                                const byLyrics = filterSongsByLyrics(songs, searchTerm);
                                const unique = mergeUniqueSongMatchesByUid(byTitle, byLyrics);
                                return limitSongbookSongsGroup({
                                    songbook,
                                    songs: unique,
                                }, limitSongsPerSongbook);
                            })
                        )
                    )
                );
            }),
            map((results) => finalizeSongbookSearchGroups(results, limitSongbooks))
        );
    }

    private applySongbookCustomKey(song: PartialSong): PartialSong {
        const customKey = song.customKey;
        const originalKey = song.songKey;
        const canTranspose = !!customKey && !!song.content && !!originalKey && customKey !== originalKey;

        if (!canTranspose) {
            return song;
        }

        try {
            const parsed = this._parserService.parseSong(song.content!);
            const transposed = this._parserService.transposeSong(parsed, customKey!);
            const content = this._parserService.formatToChordPro(transposed);
            const uniqueChords = transposed.getUniqueChords().map((chord) => chord.toString());

            return {
                ...song,
                content,
                songKey: customKey!,
                uniqueChords,
            };
        } catch {
            return song;
        }
    }

    private verifyAuthentication(): boolean {
        const user = this._auth.currentUser;
        if (!user) {
            this.showSnackbar('Authentication required');
            return false;
        }
        return true;
    }

    private showSnackbar(message: string, duration: number = 3000): void {
        this._snackBar.open(message, 'Close', {
            duration: duration,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
        });
    }

    private handleError(error: any): Observable<never> {
        console.error('Firebase service error:', error);
        let errorMessage = 'An unexpected error occurred';

        if (error.message) {
            errorMessage = error.message;
        }

        this.showSnackbar(errorMessage);
        return throwError(() => new Error(errorMessage));
    }
}
