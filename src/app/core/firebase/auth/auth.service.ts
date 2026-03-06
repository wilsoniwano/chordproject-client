import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    Auth,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    verifyBeforeUpdateEmail,
    updateProfile,
    User,
} from 'firebase/auth';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { FirebaseService } from '../firebase.service';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private _auth: Auth;
    private _snackBar: MatSnackBar;
    private _user = new BehaviorSubject<User>(null);
    private _authenticated = new BehaviorSubject<boolean>(false);
    private _authReady = new BehaviorSubject<boolean>(false);
    private _mockMode = this._isMockModeEnabled();

    constructor() {
        const firebase = inject(FirebaseService);
        this._auth = firebase.auth;
        this._snackBar = inject(MatSnackBar);

        if (this._mockMode) {
            const storedUser = this._getMockUserFromStorage();
            this._user.next(storedUser);
            this._authenticated.next(!!storedUser);
            this._authReady.next(true);
            return;
        }

        onAuthStateChanged(this._auth, (user) => {
            if (user) {
                this._user.next(user);
                this._authenticated.next(true);
            } else {
                this._user.next(null);
                this._authenticated.next(false);
            }

            this._authReady.next(true);
        });
    }

    get user$(): Observable<User> {
        return this._user.asObservable();
    }

    get authenticated$(): Observable<boolean> {
        return this._authenticated.asObservable();
    }

    get authReady$(): Observable<boolean> {
        return this._authReady.asObservable();
    }

    signInWithEmail(email: string, password: string): Observable<User> {
        if (this._mockMode) {
            return from(this._signInWithEmailMock(email, password));
        }

        return from(
            signInWithEmailAndPassword(this._auth, email, password)
                .then((result) => {
                    return result.user;
                })
                .catch((error) => {
                    this.showSnackbar(`Sign in failed: ${error.message}`);
                    throw error;
                })
        );
    }

    signInWithGoogle(): Observable<User> {
        if (this._mockMode) {
            return from(
                Promise.reject(new Error('Google sign in is not supported in e2e mock mode'))
            );
        }

        const provider = new GoogleAuthProvider();
        return from(
            signInWithPopup(this._auth, provider)
                .then((result) => {
                    return result.user;
                })
                .catch((error) => {
                    this.showSnackbar(
                        `Google sign in failed: ${error.message}`
                    );
                    throw error;
                })
        );
    }

    createUser(email: string, password: string, name?: string): Observable<User> {
        if (this._mockMode) {
            return from(this._createUserMock(email, password, name));
        }

        return from(
            createUserWithEmailAndPassword(this._auth, email, password)
                .then(async (result) => {
                    const displayName = (name || '').trim();
                    if (displayName) {
                        await updateProfile(result.user, { displayName });
                    }
                    return result.user;
                })
                .catch((error) => {
                    this.showSnackbar(`Registration failed: ${error.message}`);
                    throw error;
                })
        );
    }

    forgotPassword(email: string): Observable<void> {
        if (this._mockMode) {
            return from(Promise.resolve());
        }

        return from(
            sendPasswordResetEmail(this._auth, email)
                .then(() => {
                    this.showSnackbar('Password reset email sent');
                })
                .catch((error) => {
                    this.showSnackbar(
                        `Failed to send reset email: ${error.message}`
                    );
                    throw error;
                })
        );
    }

    signOut(): Observable<void> {
        if (this._mockMode) {
            return from(this._signOutMock());
        }

        return from(
            signOut(this._auth)
                .then(() => {})
                .catch((error) => {
                    this.showSnackbar(`Sign out failed: ${error.message}`);
                    throw error;
                })
        );
    }

    updateDisplayName(name: string): Observable<void> {
        if (this._mockMode) {
            return from(this._updateDisplayNameMock(name));
        }

        const currentUser = this._auth.currentUser;
        if (!currentUser) {
            return from(Promise.reject(new Error('Usuário não autenticado.')));
        }

        const displayName = (name || '').trim();

        return from(
            updateProfile(currentUser, { displayName })
                .then(() => {
                    this._user.next(currentUser);
                    this.showSnackbar('Nome atualizado com sucesso.');
                })
                .catch((error) => {
                    this.showSnackbar(`Não foi possível atualizar o nome: ${error.message}`);
                    throw error;
                })
        );
    }

    requestEmailUpdate(newEmail: string): Observable<void> {
        if (this._mockMode) {
            return from(this._requestEmailUpdateMock(newEmail));
        }

        const currentUser = this._auth.currentUser;
        if (!currentUser) {
            return from(Promise.reject(new Error('Usuário não autenticado.')));
        }

        const email = (newEmail || '').trim();

        return from(
            verifyBeforeUpdateEmail(currentUser, email)
                .then(() => {
                    this.showSnackbar('Enviamos um link de confirmação para o novo e-mail.');
                })
                .catch((error) => {
                    this.showSnackbar(`Não foi possível atualizar o e-mail: ${error.message}`);
                    throw error;
                })
        );
    }

    private showSnackbar(message: string, duration: number = 3000): void {
        this._snackBar.open(message, 'Close', {
            duration: duration,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
        });
    }

    private _isMockModeEnabled(): boolean {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.localStorage.getItem('e2e.mockAuth') === '1';
    }

    private _getMockUserFromStorage(): User | null {
        if (typeof window === 'undefined') {
            return null;
        }

        const raw = window.localStorage.getItem('e2e.mockAuth.user');
        if (!raw) {
            return null;
        }

        return JSON.parse(raw) as User;
    }

    private _setMockUser(user: User | null): void {
        this._user.next(user);
        this._authenticated.next(!!user);

        if (typeof window !== 'undefined') {
            if (user) {
                window.localStorage.setItem('e2e.mockAuth.user', JSON.stringify(user));
            } else {
                window.localStorage.removeItem('e2e.mockAuth.user');
            }
        }
    }

    private _buildMockUser(email: string, name?: string): User {
        return {
            uid: 'e2e-user-1',
            email,
            displayName: (name || '').trim() || 'E2E User',
            emailVerified: true,
            photoURL: '',
        } as User;
    }

    private _signInWithEmailMock(email: string, password: string): Promise<User> {
        if (email === 'e2e@local.test' && password === 'E2Epass123!') {
            const user = this._buildMockUser(email);
            this._setMockUser(user);
            return Promise.resolve(user);
        }

        const error = new Error('Invalid credentials');
        this.showSnackbar(`Sign in failed: ${error.message}`);
        return Promise.reject(error);
    }

    private _createUserMock(email: string, _password: string, name?: string): Promise<User> {
        const user = this._buildMockUser(email, name);
        this._setMockUser(user);
        return Promise.resolve(user);
    }

    private _signOutMock(): Promise<void> {
        this._setMockUser(null);
        return Promise.resolve();
    }

    private _updateDisplayNameMock(name: string): Promise<void> {
        const current = this._user.value;
        if (!current) {
            return Promise.reject(new Error('Usuário não autenticado.'));
        }

        const nextUser = {
            ...current,
            displayName: (name || '').trim(),
        } as User;
        this._setMockUser(nextUser);
        return Promise.resolve();
    }

    private _requestEmailUpdateMock(newEmail: string): Promise<void> {
        const current = this._user.value;
        if (!current) {
            return Promise.reject(new Error('Usuário não autenticado.'));
        }

        const nextUser = {
            ...current,
            email: (newEmail || '').trim(),
            emailVerified: false,
        } as User;
        this._setMockUser(nextUser);
        return Promise.resolve();
    }
}
