import nodemailer from 'nodemailer';
import type { MailMessage, MailTransport } from '@/primitives/ports/mail';

export class SmtpTransport implements MailTransport {
    private transporter: nodemailer.Transporter | null = null;

    private getTransporter(): nodemailer.Transporter {
        if (!this.transporter) {
            if (!process.env.MAIL_HOST) {
                throw new Error('SMTP driver requires MAIL_HOST to be configured');
            }
            this.transporter = nodemailer.createTransport({
                host: process.env.MAIL_HOST,
                port: Number(process.env.MAIL_PORT ?? 587),
                auth: {
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS,
                },
            });
        }
        return this.transporter;
    }

    async sendMail(message: MailMessage): Promise<void> {
        await this.getTransporter().sendMail({
            from: message.from,
            to: message.to,
            subject: message.subject,
            html: message.html,
        });
    }
}
