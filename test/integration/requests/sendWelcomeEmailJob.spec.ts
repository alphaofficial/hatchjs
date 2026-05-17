import { sendWelcomeEmailJob } from '@/jobs/handlers/sendWelcomeEmailJob';
import { Mailer } from '@/primitives/mail';
import type { MailMessage } from '@/primitives/ports/mail';

describe('sendWelcomeEmailJob', () => {
    const sent: MailMessage[] = [];

    beforeEach(() => {
        sent.length = 0;
        Mailer.reset();
        Mailer.setDriver({
            sendMail: async (message) => { sent.push(message); },
        });
    });

    afterEach(() => {
        Mailer.reset();
    });

    it('sends the welcome email through the Mailer primitive', async () => {
        await sendWelcomeEmailJob({ to: 'new@example.com', name: 'New User' });

        expect(sent).toHaveLength(1);
        expect(sent[0]).toMatchObject({
            to: 'new@example.com',
            subject: 'Welcome to The Boring Architecture',
        });
        expect(sent[0].html).toContain('Welcome to The Boring Architecture, New User!');
    });

    it('falls back to the email address when name is not provided', async () => {
        await sendWelcomeEmailJob({ to: 'new@example.com' });

        expect(sent[0].html).toContain('Welcome to The Boring Architecture, new@example.com!');
    });

    it('rejects payloads without a recipient', async () => {
        await expect(sendWelcomeEmailJob({ name: 'No Email' } as never)).rejects.toThrow(
            'sendWelcomeEmailJob requires payload.to',
        );
        expect(sent).toHaveLength(0);
    });
});
