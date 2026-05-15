import { PasswordReset } from '@/core/models/PasswordReset';
import { Session } from '@/core/models/Session';
import { User } from '@/core/models/User';
import { ResetPassword } from '@/core/use-cases/ResetPassword';
import { Hash } from '@/adapters/outbound/crypto/Hash';
import type { UserRepository } from '@/ports/user-repository';

class InMemoryUserRepository implements Pick<UserRepository, 'findOne' | 'nativeDelete' | 'flush'> {
    public readonly users = new Map<string, User>();
    public readonly passwordResets = new Map<string, PasswordReset>();
    public readonly sessions = new Map<string, Session[]>();
    public flushCalls = 0;

    async findOne(entity: typeof User, where: Partial<User>): Promise<User | null>;
    async findOne(entity: typeof PasswordReset, where: Partial<PasswordReset>): Promise<PasswordReset | null>;
    async findOne(
        entity: typeof User | typeof PasswordReset,
        where: Partial<User> | Partial<PasswordReset>
    ): Promise<User | PasswordReset | null> {
        if (entity === User) {
            if (where.email) {
                return this.users.get(where.email) ?? null;
            }

            return null;
        }

        if (entity === PasswordReset) {
            if (!where.email) {
                return null;
            }

            const reset = this.passwordResets.get(where.email) ?? null;
            if (!reset) {
                return null;
            }

            if (where.tokenHash && reset.tokenHash !== where.tokenHash) {
                return null;
            }

            return reset;
        }

        throw new Error('Unsupported entity');
    }

    async nativeDelete(entity: typeof PasswordReset, where: Partial<PasswordReset>): Promise<number>;
    async nativeDelete(entity: typeof Session, where: Partial<Session>): Promise<number>;
    async nativeDelete(
        entity: typeof PasswordReset | typeof Session,
        where: Partial<PasswordReset> | Partial<Session>
    ): Promise<number> {
        if (entity === PasswordReset) {
            if (!where.email) {
                return 0;
            }

            return this.passwordResets.delete(where.email) ? 1 : 0;
        }

        if (entity === Session) {
            if (!where.user_id) {
                return 0;
            }

            const deleted = this.sessions.get(where.user_id)?.length ?? 0;
            this.sessions.delete(where.user_id);
            return deleted;
        }

        throw new Error('Unsupported entity');
    }

    async flush(): Promise<void> {
        this.flushCalls += 1;
    }
}

describe('ResetPassword', () => {
    it('updates the user password, deletes the reset token, deletes sessions, and flushes', async () => {
        const users = new InMemoryUserRepository();
        const existingUser = new User(
            'user-123',
            'Reset User',
            'reset@example.com',
            await Hash.make('oldPassword123'),
        );
        users.users.set(existingUser.email, existingUser);

        const reset = new PasswordReset();
        reset.email = existingUser.email;
        reset.tokenHash = 'hashed:raw-token';
        reset.createdAt = new Date('2026-05-10T09:00:00.000Z');
        users.passwordResets.set(reset.email, reset);

        const sessionA = new Session();
        sessionA.id = 'session-a';
        sessionA.user_id = existingUser.id;
        const sessionB = new Session();
        sessionB.id = 'session-b';
        sessionB.user_id = existingUser.id;
        users.sessions.set(existingUser.id, [sessionA, sessionB]);

        const useCase = new ResetPassword({
            users,
            hasher: Hash,
            passwordResetExpiryMinutes: 60,
            makeTokenHash: token => `hashed:${token}`,
            now: () => new Date('2026-05-10T09:30:00.000Z'),
        });

        const result = await useCase.execute({
            token: 'raw-token',
            email: existingUser.email,
            password: 'newPassword123',
        });

        expect(result).toEqual({ status: 'password_reset' });
        await expect(Hash.check('newPassword123', existingUser.password)).resolves.toBe(true);
        expect(users.passwordResets.has(existingUser.email)).toBe(false);
        expect(users.sessions.has(existingUser.id)).toBe(false);
        expect(users.flushCalls).toBe(1);
    });

    it('returns invalid_token without changing state when the token lookup fails', async () => {
        const users = new InMemoryUserRepository();
        const existingUser = new User('user-123', 'Reset User', 'reset@example.com', await Hash.make('oldPassword123'));
        users.users.set(existingUser.email, existingUser);

        const useCase = new ResetPassword({
            users,
            hasher: Hash,
            passwordResetExpiryMinutes: 60,
            makeTokenHash: token => `hashed:${token}`,
            now: () => new Date('2026-05-10T09:30:00.000Z'),
        });

        const result = await useCase.execute({
            token: 'missing-token',
            email: existingUser.email,
            password: 'newPassword123',
        });

        expect(result).toEqual({ status: 'invalid_token' });
        await expect(Hash.check('oldPassword123', existingUser.password)).resolves.toBe(true);
        expect(users.flushCalls).toBe(0);
    });

    it('deletes expired reset tokens and returns expired_token', async () => {
        const users = new InMemoryUserRepository();
        const existingUser = new User('user-123', 'Reset User', 'reset@example.com', await Hash.make('oldPassword123'));
        users.users.set(existingUser.email, existingUser);

        const reset = new PasswordReset();
        reset.email = existingUser.email;
        reset.tokenHash = 'hashed:expired-token';
        reset.createdAt = new Date('2026-05-10T08:00:00.000Z');
        users.passwordResets.set(reset.email, reset);

        const useCase = new ResetPassword({
            users,
            hasher: Hash,
            passwordResetExpiryMinutes: 30,
            makeTokenHash: token => `hashed:${token}`,
            now: () => new Date('2026-05-10T09:30:00.000Z'),
        });

        const result = await useCase.execute({
            token: 'expired-token',
            email: existingUser.email,
            password: 'newPassword123',
        });

        expect(result).toEqual({ status: 'expired_token' });
        expect(users.passwordResets.has(existingUser.email)).toBe(false);
        await expect(Hash.check('oldPassword123', existingUser.password)).resolves.toBe(true);
        expect(users.flushCalls).toBe(0);
    });
});
