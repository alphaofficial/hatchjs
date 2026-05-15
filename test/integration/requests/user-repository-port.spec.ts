import { PasswordReset } from '@/core/models/PasswordReset';
import { Session } from '@/core/models/Session';
import { User } from '@/core/models/User';
import type { UserRepository, UserRepositoryEntity, UserRepositoryEntityClass } from '@/ports/user-repository';

describe('user repository port', () => {
    it('supports the expected UserRepository contract', async () => {
        const calls: unknown[][] = [];

        const createEntity = <T extends UserRepositoryEntity>(
            entity: UserRepositoryEntityClass<T>,
            data: Partial<T>
        ): T => {
            if (entity === User) {
                return Object.assign(new User('user-1', 'Alice', 'alice@example.com', 'hashed-password'), data) as T;
            }

            if (entity === PasswordReset) {
                return Object.assign(new PasswordReset(), data) as T;
            }

            return Object.assign(new Session(), data) as T;
        };

        const repository: UserRepository = {
            findOne: async (entity, where) => {
                calls.push(['findOne', entity.name, where]);
                if (entity === User) {
                    return createEntity(entity, { email: 'alice@example.com' } as Partial<typeof where>);
                }
                return null;
            },
            persistAndFlush: async (entity) => {
                calls.push(['persistAndFlush', entity.constructor.name, entity]);
            },
            create: (entity, data) => {
                calls.push(['create', entity.name, data]);
                return createEntity(entity, data);
            },
            nativeDelete: async (entity, where) => {
                calls.push(['nativeDelete', entity.name, where]);
                return 1;
            },
            flush: async () => {
                calls.push(['flush']);
            },
        };

        const existingUser = await repository.findOne(User, { email: 'alice@example.com' });
        const reset = repository.create(PasswordReset, {
            email: 'alice@example.com',
            tokenHash: 'token-hash',
            createdAt: new Date('2026-05-10T00:00:00.000Z'),
        });

        await repository.persistAndFlush(reset);
        const deleted = await repository.nativeDelete(Session, { user_id: 'user-1' });
        await repository.flush();

        expect(existingUser).toBeInstanceOf(User);
        expect(existingUser?.email).toBe('alice@example.com');
        expect(reset).toBeInstanceOf(PasswordReset);
        expect(reset.tokenHash).toBe('token-hash');
        expect(deleted).toBe(1);
        expect(calls).toEqual([
            ['findOne', 'User', { email: 'alice@example.com' }],
            ['create', 'PasswordReset', {
                email: 'alice@example.com',
                tokenHash: 'token-hash',
                createdAt: new Date('2026-05-10T00:00:00.000Z'),
            }],
            ['persistAndFlush', 'PasswordReset', reset],
            ['nativeDelete', 'Session', { user_id: 'user-1' }],
            ['flush'],
        ]);
    });
});
