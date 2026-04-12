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

const drivers = new Map<string, MailTransport>();
drivers.set('log', new LogTransport());

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
