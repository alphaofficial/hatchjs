import nodemailer from 'nodemailer';
import { PinoLogger } from '../logger/pinoLogger';

export interface MailMessage {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

export interface MailTransport {
    sendMail(message: MailMessage): Promise<void>;
}

class LogTransport implements MailTransport {
    async sendMail(message: MailMessage): Promise<void> {
        PinoLogger.info('mail', `[LOG DRIVER] To: ${message.to} | Subject: ${message.subject}`, { html: message.html });
    }
}

class SmtpTransport implements MailTransport {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT ?? 587),
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });
    }

    async sendMail(message: MailMessage): Promise<void> {
        await this.transporter.sendMail({
            from: message.from,
            to: message.to,
            subject: message.subject,
            html: message.html,
        });
    }
}

const drivers = new Map<string, MailTransport>();
drivers.set('log', new LogTransport());
drivers.set('smtp', new SmtpTransport());

export function registerDriver(name: string, driver: MailTransport): void {
    drivers.set(name, driver);
}

export async function sendMail(to: string, subject: string, html: string): Promise<void> {
    const driverName = process.env.MAIL_DRIVER ?? 'log';
    const driver = drivers.get(driverName);
    if (!driver) {
        throw new Error(`Mail driver '${driverName}' is not registered`);
    }
    const from = process.env.MAIL_FROM ?? 'noreply@example.com';
    await driver.sendMail({ to, subject, html, from });
}
