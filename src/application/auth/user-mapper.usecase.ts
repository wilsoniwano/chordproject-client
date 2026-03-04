import { User } from 'app/core/user/user.types';

export function mapFirebaseUserToUser(firebaseUser: any): User | null {
    if (!firebaseUser) {
        return null;
    }

    return {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName ?? '',
        email: firebaseUser.email ?? '',
        emailVerified: firebaseUser.emailVerified ?? false,
        avatar: firebaseUser.photoURL ?? '',
    };
}

