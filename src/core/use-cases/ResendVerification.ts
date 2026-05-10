import type { User } from '@/core/models/User';
import type { MailTransport } from '@/ports/mail';

export interface ResendVerificationInput {
    user: Pick<User, 'id' | 'email' | 'emailVerifiedAt'>;
}

export type ResendVerificationResult =
    | { status: 'already_verified' }
    | { status: 'resent' };

export interface ResendVerificationDependencies {
    mailTransport: MailTransport;
    appUrl: string;
    makeVerificationToken: (user: Pick<User, 'id' | 'email'>) => string;
}

export class ResendVerification {
    private readonly mailTransport: MailTransport;
    private readonly appUrl: string;
    private readonly makeVerificationToken: ResendVerificationDependencies['makeVerificationToken'];

    constructor({
        mailTransport,
        appUrl,
        makeVerificationToken,
    }: ResendVerificationDependencies) {
        this.mailTransport = mailTransport;
        this.appUrl = appUrl;
        this.makeVerificationToken = makeVerificationToken;
    }

    async execute(input: ResendVerificationInput): Promise<ResendVerificationResult> {
        if (input.user.emailVerifiedAt) {
            return { status: 'already_verified' };
        }

        const token = this.makeVerificationToken(input.user);
        const verifyUrl = `${this.appUrl}/verify-email/${token}`;

        await this.mailTransport.sendMail({
            to: input.user.email,
            subject: 'Verify your email address',
            html: `
                <p>Please verify your email address.</p>
                <p><a href="${verifyUrl}">Click here to verify your email address</a></p>
                <p>If you did not create an account, please ignore this email.</p>
            `,
        });

        return { status: 'resent' };
    }
}
