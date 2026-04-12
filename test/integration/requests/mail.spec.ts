import { sendMail, registerDriver, MailTransport, MailMessage } from '@/lib/mail';

describe('mailer', () => {
    it('sends via log driver by default (no error thrown)', async () => {
        const prev = process.env.MAIL_DRIVER;
        try {
            delete process.env.MAIL_DRIVER;
            await expect(sendMail('test@example.com', 'Hello', '<p>Hi</p>')).resolves.toBeUndefined();
        } finally {
            if (prev === undefined) delete process.env.MAIL_DRIVER;
            else process.env.MAIL_DRIVER = prev;
        }
    });

    it('sends via a registered mock transport', async () => {
        const sent: MailMessage[] = [];
        const mockTransport: MailTransport = {
            sendMail: async (msg) => { sent.push(msg); },
        };
        registerDriver('mock', mockTransport);
        const prev = process.env.MAIL_DRIVER;
        try {
            process.env.MAIL_DRIVER = 'mock';
            await sendMail('user@example.com', 'Test Subject', '<b>Body</b>');
            expect(sent).toHaveLength(1);
            expect(sent[0].to).toBe('user@example.com');
            expect(sent[0].subject).toBe('Test Subject');
            expect(sent[0].html).toBe('<b>Body</b>');
        } finally {
            if (prev === undefined) delete process.env.MAIL_DRIVER;
            else process.env.MAIL_DRIVER = prev;
        }
    });

    it('uses MAIL_FROM env var as from address', async () => {
        const sent: MailMessage[] = [];
        const mockTransport: MailTransport = {
            sendMail: async (msg) => { sent.push(msg); },
        };
        registerDriver('mock-from', mockTransport);
        const prevDriver = process.env.MAIL_DRIVER;
        const prevFrom = process.env.MAIL_FROM;
        try {
            process.env.MAIL_DRIVER = 'mock-from';
            process.env.MAIL_FROM = 'sender@myapp.com';
            await sendMail('recipient@example.com', 'Subj', '<p>test</p>');
            expect(sent[0].from).toBe('sender@myapp.com');
        } finally {
            if (prevDriver === undefined) delete process.env.MAIL_DRIVER;
            else process.env.MAIL_DRIVER = prevDriver;
            if (prevFrom === undefined) delete process.env.MAIL_FROM;
            else process.env.MAIL_FROM = prevFrom;
        }
    });

    it('throws when an unregistered driver is selected', async () => {
        const prev = process.env.MAIL_DRIVER;
        try {
            process.env.MAIL_DRIVER = 'nonexistent-driver';
            await expect(sendMail('x@x.com', 's', 'h')).rejects.toThrow("Mail driver 'nonexistent-driver' is not registered");
        } finally {
            if (prev === undefined) delete process.env.MAIL_DRIVER;
            else process.env.MAIL_DRIVER = prev;
        }
    });
});
