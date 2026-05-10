import nodemailer from 'nodemailer';
import { SmtpTransport } from '@/adapters/outbound/mail/smtp';

jest.mock('nodemailer', () => ({
    __esModule: true,
    default: {
        createTransport: jest.fn(),
    },
}));

describe('smtp transport adapter', () => {
    const createTransport = nodemailer.createTransport as jest.Mock;
    const originalMailHost = process.env.MAIL_HOST;
    const originalMailPort = process.env.MAIL_PORT;
    const originalMailUser = process.env.MAIL_USER;
    const originalMailPass = process.env.MAIL_PASS;

    afterEach(() => {
        jest.clearAllMocks();
        if (originalMailHost === undefined) delete process.env.MAIL_HOST;
        else process.env.MAIL_HOST = originalMailHost;
        if (originalMailPort === undefined) delete process.env.MAIL_PORT;
        else process.env.MAIL_PORT = originalMailPort;
        if (originalMailUser === undefined) delete process.env.MAIL_USER;
        else process.env.MAIL_USER = originalMailUser;
        if (originalMailPass === undefined) delete process.env.MAIL_PASS;
        else process.env.MAIL_PASS = originalMailPass;
    });

    it('sends mail through nodemailer using the configured SMTP settings', async () => {
        const sendMail = jest.fn().mockResolvedValue(undefined);
        createTransport.mockReturnValue({ sendMail });
        process.env.MAIL_HOST = 'smtp.example.com';
        process.env.MAIL_PORT = '2525';
        process.env.MAIL_USER = 'mailer';
        process.env.MAIL_PASS = 'secret';

        const transport = new SmtpTransport();

        await transport.sendMail({
            to: 'user@example.com',
            subject: 'Welcome',
            html: '<p>Hello</p>',
            from: 'noreply@example.com',
        });

        expect(createTransport).toHaveBeenCalledWith({
            host: 'smtp.example.com',
            port: 2525,
            auth: {
                user: 'mailer',
                pass: 'secret',
            },
        });
        expect(sendMail).toHaveBeenCalledWith({
            from: 'noreply@example.com',
            to: 'user@example.com',
            subject: 'Welcome',
            html: '<p>Hello</p>',
        });
    });

    it('throws when MAIL_HOST is missing', async () => {
        const transport = new SmtpTransport();

        await expect(
            transport.sendMail({
                to: 'user@example.com',
                subject: 'Welcome',
                html: '<p>Hello</p>',
                from: 'noreply@example.com',
            })
        ).rejects.toThrow('SMTP driver requires MAIL_HOST to be configured');

        expect(createTransport).not.toHaveBeenCalled();
    });
});
