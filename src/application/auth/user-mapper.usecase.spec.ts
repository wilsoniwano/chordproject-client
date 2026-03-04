import { describe, expect, it } from 'vitest';
import { mapFirebaseUserToUser } from './user-mapper.usecase';

describe('user mapper use case', () => {
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

