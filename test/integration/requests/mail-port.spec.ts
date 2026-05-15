import type { MailMessage, MailTransport } from '@/ports/mail';

describe('mail port', () => {
    it('supports the expected MailTransport contract', async () => {
        const sent: MailMessage[] = [];
        const transport: MailTransport = {
            sendMail: async (message) => {
                sent.push(message);
            },
        };

        const message: MailMessage = {
            to: 'user@example.com',
            subject: 'Welcome',
            html: '<p>Hello</p>',
            from: 'noreply@example.com',
        };

        await transport.sendMail(message);

        expect(sent).toEqual([message]);
    });
});
