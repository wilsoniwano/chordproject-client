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
    private _mockMode = this._isMockModeEnabled();

    constructor() {
        const firebase = inject(FirebaseService);
        this._auth = firebase.auth;
        this._snackBar = inject(MatSnackBar);

        if (this._mockMode) {
            const storedUser = this._getMockUserFromStorage();
            this._user.next(storedUser);
            this._authenticated.next(!!storedUser);
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
        });
    }

    get user$(): Observable<User> {
        return this._user.asObservable();
    }

    get authenticated$(): Observable<boolean> {
        return this._authenticated.asObservable();
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

    createUser(email: string, password: string): Observable<User> {
        if (this._mockMode) {
            return from(this._createUserMock(email, password));
        }

        return from(
            createUserWithEmailAndPassword(this._auth, email, password)
                .then((result) => {
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

    private _buildMockUser(email: string): User {
        return {
            uid: 'e2e-user-1',
            email,
            displayName: 'E2E User',
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

    private _createUserMock(email: string, _password: string): Promise<User> {
        const user = this._buildMockUser(email);
        this._setMockUser(user);
        return Promise.resolve(user);
    }

    private _signOutMock(): Promise<void> {
        this._setMockUser(null);
        return Promise.resolve();
    }
}
