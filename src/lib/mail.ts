import type { MailMessage, MailTransport } from '@/ports/mail';
import { LogTransport } from '@/adapters/outbound/mail/log';
import { SmtpTransport } from '@/adapters/outbound/mail/smtp';

const drivers = new Map<string, MailTransport>();
drivers.set('log', new LogTransport());
drivers.set('smtp', new SmtpTransport());

export class Mailer {
    static registerDriver(name: string, driver: MailTransport): void {
        drivers.set(name, driver);
    }

    static async send(to: string, subject: string, html: string): Promise<void> {
        const driverName = process.env.MAIL_DRIVER ?? 'log';
        const driver = drivers.get(driverName);
        if (!driver) {
            throw new Error(`Mail driver '${driverName}' is not registered`);
        }
        const from = process.env.MAIL_FROM ?? 'noreply@example.com';
        await driver.sendMail({ to, subject, html, from });
    }
}
