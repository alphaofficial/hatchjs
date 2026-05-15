import { PasswordReset } from '@/core/models/PasswordReset';
import { User } from '@/core/models/User';
import { ForgotPassword } from '@/core/use-cases/ForgotPassword';
import type { MailMessage, MailTransport } from '@/ports/mail';
import type { UserRepository } from '@/ports/user-repository';

class InMemoryUserRepository implements Pick<UserRepository, 'findOne' | 'persistAndFlush' | 'nativeDelete'> {
    public readonly users = new Map<string, User>();
    public readonly passwordResets = new Map<string, PasswordReset>();

    async findOne(entity: typeof User, where: Partial<User>): Promise<User | null>;
    async findOne(entity: typeof PasswordReset, where: Partial<PasswordReset>): Promise<PasswordReset | null>;
    async findOne(
        entity: typeof User | typeof PasswordReset,
        where: Partial<User> | Partial<PasswordReset>
    ): Promise<User | PasswordReset | null> {
        if (!where.email) {
            return null;
        }

        if (entity === User) {
            return this.users.get(where.email) ?? null;
        }

        if (entity === PasswordReset) {
            return this.passwordResets.get(where.email) ?? null;
        }

        throw new Error('Unsupported entity');
    }

    async persistAndFlush(entity: User | PasswordReset): Promise<void> {
        if (entity instanceof User) {
            this.users.set(entity.email, entity);
            return;
        }

        if (entity instanceof PasswordReset) {
            this.passwordResets.set(entity.email, entity);
            return;
        }

        throw new Error('Unsupported entity');
    }

    async nativeDelete(entity: typeof PasswordReset, where: Partial<PasswordReset>): Promise<number>;
    async nativeDelete(entity: typeof User, where: Partial<User>): Promise<number>;
    async nativeDelete(
        entity: typeof User | typeof PasswordReset,
        where: Partial<User> | Partial<PasswordReset>
    ): Promise<number> {
        if (!where.email) {
            return 0;
        }

        if (entity === PasswordReset) {
            return this.passwordResets.delete(where.email) ? 1 : 0;
        }

        if (entity === User) {
            return this.users.delete(where.email) ? 1 : 0;
        }

        throw new Error('Unsupported entity');
    }
}

class InMemoryMailTransport implements MailTransport {
    public readonly sent: MailMessage[] = [];

    async sendMail(message: MailMessage): Promise<void> {
        this.sent.push(message);
    }
}

describe('ForgotPassword', () => {
    it('replaces any existing reset token and sends the password reset email', async () => {
        const users = new InMemoryUserRepository();
        users.users.set(
            'reset@example.com',
            new User('user-123', 'Existing User', 'reset@example.com', 'hashed-password')
        );

        const previousReset = new PasswordReset();
        previousReset.email = 'reset@example.com';
        previousReset.tokenHash = 'old-token-hash';
        previousReset.createdAt = new Date('2026-05-01T00:00:00.000Z');
        users.passwordResets.set(previousReset.email, previousReset);

        const mailTransport = new InMemoryMailTransport();
        const now = new Date('2026-05-10T09:30:00.000Z');
        const useCase = new ForgotPassword({
            users,
            mailTransport,
            appUrl: 'https://example.test',
            passwordResetExpiryMinutes: 60,
            createResetToken: () => ({
                rawToken: 'raw-reset-token',
                tokenHash: 'new-token-hash',
            }),
            now: () => now,
        });

        const result = await useCase.execute({ email: 'reset@example.com' });

        expect(result).toEqual({ status: 'processed' });

        const reset = users.passwordResets.get('reset@example.com');
        expect(reset).toBeDefined();
        expect(reset).not.toBe(previousReset);
        expect(reset?.tokenHash).toBe('new-token-hash');
        expect(reset?.createdAt).toBe(now);

        expect(mailTransport.sent).toHaveLength(1);
        expect(mailTransport.sent[0]?.to).toBe('reset@example.com');
        expect(mailTransport.sent[0]?.subject).toBe('Password Reset Request');
        expect(mailTransport.sent[0]?.html).toContain(
            'https://example.test/reset-password/raw-reset-token?email=reset%40example.com'
        );
        expect(mailTransport.sent[0]?.html).toContain('This link expires in 60 minutes.');
    });

    it('returns success without storing a reset token or sending email for an unknown address', async () => {
        const users = new InMemoryUserRepository();
        const mailTransport = new InMemoryMailTransport();
        const useCase = new ForgotPassword({
            users,
            mailTransport,
            appUrl: 'https://example.test',
            passwordResetExpiryMinutes: 60,
            createResetToken: () => ({
                rawToken: 'unused-token',
                tokenHash: 'unused-hash',
            }),
            now: () => new Date('2026-05-10T09:30:00.000Z'),
        });

        const result = await useCase.execute({ email: 'missing@example.com' });

        expect(result).toEqual({ status: 'processed' });
        expect(users.passwordResets.size).toBe(0);
        expect(mailTransport.sent).toHaveLength(0);
    });
});
