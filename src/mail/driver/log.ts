import { PinoLogger } from '@/logger/pinoLogger';
import type { MailMessage, MailTransport } from '@/primitives/ports/mail';

export class LogTransport implements MailTransport {
    async sendMail(message: MailMessage): Promise<void> {
        PinoLogger.info({
            scope: 'mail',
            message: `[LOG DRIVER] To: ${message.to} | Subject: ${message.subject}`,
            params: { html: message.html },
        });
    }
}
