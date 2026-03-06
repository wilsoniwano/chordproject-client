import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Leader } from 'app/models/leader';
import { Auth } from 'firebase/auth';
import {
    Firestore,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
} from 'firebase/firestore';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FirebaseService } from '../firebase.service';

@Injectable({
    providedIn: 'root',
})
export class LeaderService {
    private _firestore: Firestore;
    private _auth: Auth;

    constructor(
        private _firebase: FirebaseService,
        private _snackBar: MatSnackBar
    ) {
        this._firestore = this._firebase.firestore;
        this._auth = this._firebase.auth;
    }

    getAll(): Observable<Leader[]> {
        const q = query(collection(this._firestore, 'leaders'), orderBy('name'));
        return from(getDocs(q)).pipe(
            map((snapshot) =>
                snapshot.docs.map(
                    (leaderDoc) =>
                        ({
                            uid: leaderDoc.id,
                            ...leaderDoc.data(),
                        }) as Leader
                )
            ),
            catchError((error) => this.handleError(error))
        );
    }

    async save(leader: Leader): Promise<string> {
        if (!this.verifyAuthentication()) {
            return null;
        }

        const name = (leader?.name || '').trim();
        if (!name) {
            this.showSnackbar('Nome do dirigente é obrigatório');
            return null;
        }

        try {
            const user = this._auth.currentUser;
            const uid = leader.uid || doc(collection(this._firestore, 'leaders')).id;
            const payload = {
                ...leader,
                uid,
                name,
                authorId: user.uid,
                source: leader.source || 'cifrapro',
                creationDate: leader.creationDate || serverTimestamp(),
            };

            await setDoc(doc(this._firestore, 'leaders', uid), payload, { merge: true });
            this.showSnackbar('Dirigente salvo com sucesso');
            return uid;
        } catch (error) {
            this.handleError(error);
            return null;
        }
    }

    async delete(uid: string): Promise<boolean> {
        if (!this.verifyAuthentication()) {
            return false;
        }

        try {
            await deleteDoc(doc(this._firestore, 'leaders', uid));
            this.showSnackbar('Dirigente excluído com sucesso');
            return true;
        } catch (error) {
            this.handleError(error);
            return false;
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

    private showSnackbar(message: string, duration = 3000): void {
        this._snackBar.open(message, 'Close', {
            duration,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
        });
    }

    private handleError(error: any): Observable<never> {
        console.error('Firebase service error:', error);
        const errorMessage = error?.message || 'An unexpected error occurred';
        this.showSnackbar(errorMessage);
        return throwError(() => new Error(errorMessage));
    }
}
