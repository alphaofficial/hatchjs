import type { MailMessage, MailTransport } from '@/ports/mail';
import { LogTransport } from './log';
import { SmtpTransport } from './smtp';

const drivers = new Map<string, MailTransport>([
    ['log', new LogTransport()],
    ['smtp', new SmtpTransport()],
]);

export function registerMailTransport(name: string, driver: MailTransport): void {
    drivers.set(name, driver);
}

export function resolveMailTransport(): MailTransport {
    const driverName = process.env.MAIL_DRIVER ?? 'log';
    const driver = drivers.get(driverName);
    if (!driver) {
        throw new Error(`Mail driver '${driverName}' is not registered`);
    }
    return driver;
}

export async function sendConfiguredMail(message: MailMessage): Promise<void> {
    await resolveMailTransport().sendMail({
        ...message,
        from: message.from ?? process.env.MAIL_FROM ?? 'noreply@example.com',
    });
}
