import type { AppEvents } from '@/core/events/AppEvents';
import { User } from '@/core/models/User';
import { VerifyEmail } from '@/core/use-cases/VerifyEmail';
import type { UserRepository } from '@/ports/user-repository';

class InMemoryUserRepository implements Pick<UserRepository, 'findOne' | 'flush'> {
    public readonly users = new Map<string, User>();
    public flushCalls = 0;

    async findOne(entity: typeof User, where: Partial<User>): Promise<User | null> {
        if (entity !== User) {
            throw new Error('Unsupported entity');
        }

        for (const user of this.users.values()) {
            if (where.id && user.id !== where.id) {
                continue;
            }

            if (where.email && user.email !== where.email) {
                continue;
            }

            return user;
        }

        return null;
    }

    async flush(): Promise<void> {
        this.flushCalls += 1;
    }
}

describe('VerifyEmail', () => {
    it('marks the user as verified, flushes once, and emits the verification event', async () => {
        const users = new InMemoryUserRepository();
        const user = new User('user-123', 'Verified User', 'verify@example.com', 'hashed-password');
        users.users.set(user.id, user);

        const now = new Date('2026-05-10T12:00:00.000Z');
        const events: Array<{ event: keyof AppEvents; payload: AppEvents[keyof AppEvents] }> = [];
        const useCase = new VerifyEmail({
            users,
            emit: (event, payload) => {
                events.push({ event, payload });
            },
            now: () => now,
        });

        const result = await useCase.execute({
            id: user.id,
            email: user.email,
        });

        expect(result).toEqual({ status: 'verified' });
        expect(user.emailVerifiedAt).toBe(now);
        expect(users.flushCalls).toBe(1);
        expect(events).toEqual([
            {
                event: 'user.verified',
                payload: { id: user.id, email: user.email },
            },
        ]);
    });

    it('returns invalid_user without flushing or emitting when the payload does not match a user', async () => {
        const users = new InMemoryUserRepository();
        users.users.set(
            'user-123',
            new User('user-123', 'Verified User', 'verify@example.com', 'hashed-password')
        );

        const events: Array<{ event: keyof AppEvents; payload: AppEvents[keyof AppEvents] }> = [];
        const useCase = new VerifyEmail({
            users,
            emit: (event, payload) => {
                events.push({ event, payload });
            },
            now: () => new Date('2026-05-10T12:00:00.000Z'),
        });

        const result = await useCase.execute({
            id: 'missing-user',
            email: 'verify@example.com',
        });

        expect(result).toEqual({ status: 'invalid_user' });
        expect(users.flushCalls).toBe(0);
        expect(events).toHaveLength(0);
    });

    it('returns verified without flushing or emitting when the email is already verified', async () => {
        const users = new InMemoryUserRepository();
        const user = new User('user-123', 'Verified User', 'verify@example.com', 'hashed-password');
        user.emailVerifiedAt = new Date('2026-05-09T12:00:00.000Z');
        users.users.set(user.id, user);

        const events: Array<{ event: keyof AppEvents; payload: AppEvents[keyof AppEvents] }> = [];
        const useCase = new VerifyEmail({
            users,
            emit: (event, payload) => {
                events.push({ event, payload });
            },
            now: () => new Date('2026-05-10T12:00:00.000Z'),
        });

        const result = await useCase.execute({
            id: user.id,
            email: user.email,
        });

        expect(result).toEqual({ status: 'verified' });
        expect(user.emailVerifiedAt).toEqual(new Date('2026-05-09T12:00:00.000Z'));
        expect(users.flushCalls).toBe(0);
        expect(events).toHaveLength(0);
    });
});
