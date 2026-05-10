import { User } from '@/core/models/User';
import { ResendVerification } from '@/core/use-cases/ResendVerification';
import type { MailMessage, MailTransport } from '@/ports/mail';

class InMemoryMailTransport implements MailTransport {
    public readonly sent: MailMessage[] = [];

    async sendMail(message: MailMessage): Promise<void> {
        this.sent.push(message);
    }
}

describe('ResendVerification', () => {
    it('sends a verification email for an unverified user', async () => {
        const mailTransport = new InMemoryMailTransport();
        const user = new User('user-123', 'Resend User', 'resend@example.com', 'hashed-password');
        const useCase = new ResendVerification({
            mailTransport,
            appUrl: 'https://example.test',
            makeVerificationToken: () => 'signed-token',
        });

        const result = await useCase.execute({ user });

        expect(result).toEqual({ status: 'resent' });
        expect(mailTransport.sent).toHaveLength(1);
        expect(mailTransport.sent[0]?.to).toBe('resend@example.com');
        expect(mailTransport.sent[0]?.subject).toBe('Verify your email address');
        expect(mailTransport.sent[0]?.html).toContain('Please verify your email address.');

        const verifyLink = mailTransport.sent[0]?.html.match(/href="([^"]+)"/)?.[1];
        expect(verifyLink).toBe('https://example.test/verify-email/signed-token');
    });

    it('returns already_verified without sending mail when the email was already verified', async () => {
        const mailTransport = new InMemoryMailTransport();
        const user = new User('user-123', 'Verified User', 'verified@example.com', 'hashed-password');
        user.emailVerifiedAt = new Date('2026-05-10T12:00:00.000Z');

        const useCase = new ResendVerification({
            mailTransport,
            appUrl: 'https://example.test',
            makeVerificationToken: () => 'ignored-token',
        });

        const result = await useCase.execute({ user });

        expect(result).toEqual({ status: 'already_verified' });
        expect(mailTransport.sent).toHaveLength(0);
    });
});
