import type { MailerConfig, MailTransport } from '@/primitives/ports/mail';

export type { MailerConfig, MailMessage, MailTransport } from '@/primitives/ports/mail';

let activeDriver: MailTransport | null = null;
let config: MailerConfig = {};

export class Mailer {
    static setDriver(driver: MailTransport): void {
        activeDriver = driver;
    }

    static configure(nextConfig: MailerConfig): void {
        config = { ...config, ...nextConfig };
    }

    static reset(): void {
        activeDriver = null;
        config = {};
    }

    static async send(to: string, subject: string, html: string): Promise<void> {
        if (!activeDriver) {
            throw new Error('Mail driver is not registered');
        }
        const from = config.from ?? process.env.MAIL_FROM ?? 'noreply@example.com';
        await activeDriver.sendMail({ to, subject, html, from });
    }
}
