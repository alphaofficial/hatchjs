export interface MailMessage {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

export interface MailTransport {
    sendMail(message: MailMessage): Promise<void>;
}

export interface MailerConfig {
    from?: string;
}
