import { Mailer } from '@/primitives/mail';
import type { MailMessage, MailTransport } from '@/primitives/ports/mail';

describe('mailer', () => {
    afterEach(() => {
        Mailer.reset();
    });

    it('throws when no driver has been injected', async () => {
        Mailer.reset();

        await expect(Mailer.send('test@example.com', 'Hello', '<p>Hi</p>')).rejects.toThrow('Mail driver is not registered');
    });

    it('sends via an injected mock transport', async () => {
        const sent: MailMessage[] = [];
        const mockTransport: MailTransport = {
            sendMail: async (msg) => { sent.push(msg); },
        };
        Mailer.setDriver(mockTransport);

        await Mailer.send('user@example.com', 'Test Subject', '<b>Body</b>');

        expect(sent).toHaveLength(1);
        expect(sent[0].to).toBe('user@example.com');
        expect(sent[0].subject).toBe('Test Subject');
        expect(sent[0].html).toBe('<b>Body</b>');
    });

    it('uses MAIL_FROM env var as from address', async () => {
        const sent: MailMessage[] = [];
        const mockTransport: MailTransport = {
            sendMail: async (msg) => { sent.push(msg); },
        };
        Mailer.setDriver(mockTransport);
        const prevFrom = process.env.MAIL_FROM;
        try {
            process.env.MAIL_FROM = 'sender@myapp.com';
            await Mailer.send('recipient@example.com', 'Subj', '<p>test</p>');
            expect(sent[0].from).toBe('sender@myapp.com');
        } finally {
            if (prevFrom === undefined) delete process.env.MAIL_FROM;
            else process.env.MAIL_FROM = prevFrom;
        }
    });

    it('ignores MAIL_DRIVER after a driver has been injected', async () => {
        const prev = process.env.MAIL_DRIVER;
        const sent: MailMessage[] = [];
        Mailer.setDriver({
            sendMail: async (msg) => { sent.push(msg); },
        });

        try {
            process.env.MAIL_DRIVER = 'nonexistent-driver';
            await expect(Mailer.send('x@x.com', 's', 'h')).resolves.toBeUndefined();
            expect(sent).toHaveLength(1);
        } finally {
            if (prev === undefined) delete process.env.MAIL_DRIVER;
            else process.env.MAIL_DRIVER = prev;
        }
    });

    it('can use an injected driver without mutating MAIL_DRIVER', async () => {
        const sent: MailMessage[] = [];
        const prevDriver = process.env.MAIL_DRIVER;
        const mockTransport: MailTransport = {
            sendMail: async (msg) => { sent.push(msg); },
        };

        try {
            delete process.env.MAIL_DRIVER;
            Mailer.setDriver(mockTransport);

            await Mailer.send('user@example.com', 'Injected', '<p>Injected</p>');

            expect(process.env.MAIL_DRIVER).toBeUndefined();
            expect(sent).toHaveLength(1);
            expect(sent[0].to).toBe('user@example.com');
        } finally {
            if (prevDriver === undefined) delete process.env.MAIL_DRIVER;
            else process.env.MAIL_DRIVER = prevDriver;
        }
    });

    it('can configure the from address without mutating MAIL_FROM', async () => {
        const sent: MailMessage[] = [];
        const prevFrom = process.env.MAIL_FROM;
        try {
            delete process.env.MAIL_FROM;
            Mailer.setDriver({
                sendMail: async (msg) => { sent.push(msg); },
            });
            Mailer.configure({ from: 'configured@example.com' });

            await Mailer.send('recipient@example.com', 'Subject', '<p>Body</p>');

            expect(process.env.MAIL_FROM).toBeUndefined();
            expect(sent[0].from).toBe('configured@example.com');
        } finally {
            if (prevFrom === undefined) delete process.env.MAIL_FROM;
            else process.env.MAIL_FROM = prevFrom;
        }
    });
});
