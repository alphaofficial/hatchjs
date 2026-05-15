import type { AppEvents } from '@/core/events/AppEvents';
import { User } from '@/core/models/User';
import { RegisterUser } from '@/core/use-cases/RegisterUser';
import { Hash } from '@/adapters/outbound/crypto/Hash';
import type { MailMessage, MailTransport } from '@/ports/mail';
import type { UserRepository } from '@/ports/user-repository';

class InMemoryUserRepository implements Pick<UserRepository, 'findOne' | 'persistAndFlush'> {
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

    async persistAndFlush(entity: User): Promise<void> {
        this.users.set(entity.email, entity);
    }
}

class InMemoryMailTransport implements MailTransport {
    public readonly sent: MailMessage[] = [];

    async sendMail(message: MailMessage): Promise<void> {
        this.sent.push(message);
    }
}

describe('RegisterUser', () => {
    it('creates a user, emits an event, and sends a verification email', async () => {
        const users = new InMemoryUserRepository();
        const mailTransport = new InMemoryMailTransport();
        const events: Array<{ event: keyof AppEvents; payload: AppEvents[keyof AppEvents] }> = [];
        const useCase = new RegisterUser({
            users,
            hasher: Hash,
            mailTransport,
            emit: (event, payload) => {
                events.push({ event, payload });
            },
            appName: 'Test App',
            appUrl: 'https://example.test',
            uuid: () => 'user-123',
            makeVerificationToken: () => 'signed-token',
        });

        const result = await useCase.execute({
            name: 'New User',
            email: 'new@example.com',
            password: 'password123',
        });

        expect(result.status).toBe('registered');
        if (result.status !== 'registered') {
            throw new Error('Expected registration to succeed');
        }

        expect(result.user.id).toBe('user-123');
        expect(result.user.name).toBe('New User');
        expect(result.user.password).not.toBe('password123');
        await expect(Hash.check('password123', result.user.password)).resolves.toBe(true);
        expect(users.users.get('new@example.com')).toBe(result.user);

        expect(events).toEqual([
            {
                event: 'user.registered',
                payload: { id: 'user-123', email: 'new@example.com' },
            },
        ]);

        expect(mailTransport.sent).toHaveLength(1);
        expect(mailTransport.sent[0]?.to).toBe('new@example.com');
        expect(mailTransport.sent[0]?.subject).toBe('Verify your email address');
        expect(mailTransport.sent[0]?.html).toContain('Welcome to Test App!');

        const verifyLink = mailTransport.sent[0]?.html.match(/href="([^"]+)"/)?.[1];
        expect(verifyLink).toBeDefined();

        expect(verifyLink).toBe('https://example.test/verify-email/signed-token');
    });

    it('returns email_taken without persisting, emitting, or mailing', async () => {
        const users = new InMemoryUserRepository();
        const existingUser = new User('existing-user', 'Existing User', 'taken@example.com', 'hashed-password');
        users.users.set(existingUser.email, existingUser);

        const mailTransport = new InMemoryMailTransport();
        const events: Array<{ event: keyof AppEvents; payload: AppEvents[keyof AppEvents] }> = [];
        const useCase = new RegisterUser({
            users,
            hasher: Hash,
            mailTransport,
            emit: (event, payload) => {
                events.push({ event, payload });
            },
            appName: 'Test App',
            appUrl: 'https://example.test',
            uuid: () => 'ignored',
            makeVerificationToken: () => 'ignored',
        });

        const result = await useCase.execute({
            name: 'Another User',
            email: 'taken@example.com',
            password: 'password123',
        });

        expect(result).toEqual({ status: 'email_taken' });
        expect(users.users.size).toBe(1);
        expect(mailTransport.sent).toHaveLength(0);
        expect(events).toHaveLength(0);
    });
});
