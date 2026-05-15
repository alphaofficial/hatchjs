import type { AppEvents } from '@/core/events/AppEvents';
import { User } from '@/core/models/User';
import { LoginUser } from '@/core/use-cases/LoginUser';
import { Hash } from '@/adapters/outbound/crypto/Hash';
import type { UserRepository } from '@/ports/user-repository';

class InMemoryUserRepository implements Pick<UserRepository, 'findOne'> {
    public readonly users = new Map<string, User>();

    async findOne(entity: typeof User, where: Partial<User>): Promise<User | null> {
        if (entity !== User) {
            throw new Error('Unsupported entity');
        }

        if (where.email) {
            return this.users.get(where.email) ?? null;
        }

        return null;
    }
}

describe('LoginUser', () => {
    it('returns the matching user and emits a login event for valid credentials', async () => {
        const users = new InMemoryUserRepository();
        const existingUser = new User(
            'user-123',
            'Existing User',
            'login@example.com',
            await Hash.make('password123'),
        );
        users.users.set(existingUser.email, existingUser);

        const events: Array<{ event: keyof AppEvents; payload: AppEvents[keyof AppEvents] }> = [];
        const useCase = new LoginUser({
            users,
            hasher: Hash,
            emit: (event, payload) => {
                events.push({ event, payload });
            },
        });

        const result = await useCase.execute({
            email: 'login@example.com',
            password: 'password123',
        });

        expect(result).toEqual({
            status: 'authenticated',
            user: existingUser,
        });
        expect(events).toEqual([
            {
                event: 'user.login',
                payload: { id: 'user-123', email: 'login@example.com' },
            },
        ]);
    });

    it('returns invalid_credentials without emitting when the password is wrong', async () => {
        const users = new InMemoryUserRepository();
        users.users.set(
            'login@example.com',
            new User('user-123', 'Existing User', 'login@example.com', await Hash.make('password123')),
        );

        const events: Array<{ event: keyof AppEvents; payload: AppEvents[keyof AppEvents] }> = [];
        const useCase = new LoginUser({
            users,
            hasher: Hash,
            emit: (event, payload) => {
                events.push({ event, payload });
            },
        });

        const result = await useCase.execute({
            email: 'login@example.com',
            password: 'wrong-password',
        });

        expect(result).toEqual({ status: 'invalid_credentials' });
        expect(events).toHaveLength(0);
    });

    it('returns invalid_credentials without emitting when the user does not exist', async () => {
        const users = new InMemoryUserRepository();
        const events: Array<{ event: keyof AppEvents; payload: AppEvents[keyof AppEvents] }> = [];
        const useCase = new LoginUser({
            users,
            hasher: Hash,
            emit: (event, payload) => {
                events.push({ event, payload });
            },
        });

        const result = await useCase.execute({
            email: 'missing@example.com',
            password: 'password123',
        });

        expect(result).toEqual({ status: 'invalid_credentials' });
        expect(events).toHaveLength(0);
    });
});
