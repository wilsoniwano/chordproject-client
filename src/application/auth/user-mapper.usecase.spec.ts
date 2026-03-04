import { describe, expect, it } from 'vitest';
import { mapFirebaseUserToUser } from './user-mapper.usecase';

describe('user mapper use case', () => {
    it('maps firebase user preserving explicit values', () => {
        const mapped = mapFirebaseUserToUser({
            uid: 'u2',
            displayName: 'Alice',
            email: null,
            emailVerified: undefined,
            photoURL: 'https://cdn.local/avatar.png',
        });

        expect(mapped).toEqual({
            uid: 'u2',
            name: 'Alice',
            email: '',
            emailVerified: false,
            avatar: 'https://cdn.local/avatar.png',
        });
    });

    it('maps firebase user with defaults', () => {
        const mapped = mapFirebaseUserToUser({
            uid: 'u1',
            displayName: null,
            email: 'user@test.local',
            emailVerified: true,
            photoURL: null,
        });

        expect(mapped).toEqual({
            uid: 'u1',
            name: '',
            email: 'user@test.local',
            emailVerified: true,
            avatar: '',
        });
    });

    it('returns null when firebase user is null', () => {
        expect(mapFirebaseUserToUser(null)).toBeNull();
    });
});
