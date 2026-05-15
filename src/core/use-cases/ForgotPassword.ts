import { PasswordReset } from '@/core/models/PasswordReset';
import { User } from '@/core/models/User';
import type { MailTransport } from '@/ports/mail';
import type { UserRepository } from '@/ports/user-repository';

export interface ForgotPasswordInput {
    email: string;
}

export type ForgotPasswordResult = {
    status: 'processed';
};

export interface PasswordResetToken {
    rawToken: string;
    tokenHash: string;
}

export interface ForgotPasswordDependencies {
    users: Pick<UserRepository, 'findOne' | 'persistAndFlush' | 'nativeDelete'>;
    mailTransport: MailTransport;
    appUrl: string;
    passwordResetExpiryMinutes: number;
    createResetToken: () => PasswordResetToken;
    now: () => Date;
}

export class ForgotPassword {
    private readonly users: ForgotPasswordDependencies['users'];
    private readonly mailTransport: MailTransport;
    private readonly appUrl: string;
    private readonly passwordResetExpiryMinutes: number;
    private readonly createResetToken: ForgotPasswordDependencies['createResetToken'];
    private readonly now: () => Date;

    constructor({
        users,
        mailTransport,
        appUrl,
        passwordResetExpiryMinutes,
        createResetToken,
        now,
    }: ForgotPasswordDependencies) {
        this.users = users;
        this.mailTransport = mailTransport;
        this.appUrl = appUrl;
        this.passwordResetExpiryMinutes = passwordResetExpiryMinutes;
        this.createResetToken = createResetToken;
        this.now = now;
    }

    async execute(input: ForgotPasswordInput): Promise<ForgotPasswordResult> {
        const user = await this.users.findOne(User, { email: input.email });

        if (!user) {
            return { status: 'processed' };
        }

        const { rawToken, tokenHash } = this.createResetToken();

        await this.users.nativeDelete(PasswordReset, { email: input.email });

        const reset = new PasswordReset();
        reset.email = input.email;
        reset.tokenHash = tokenHash;
        reset.createdAt = this.now();
        await this.users.persistAndFlush(reset);

        const resetUrl = `${this.appUrl}/reset-password/${rawToken}?email=${encodeURIComponent(input.email)}`;

        await this.mailTransport.sendMail({
            to: input.email,
            subject: 'Password Reset Request',
            html: `
                <p>You requested a password reset for your account.</p>
                <p><a href="${resetUrl}">Click here to reset your password</a></p>
                <p>This link expires in ${this.passwordResetExpiryMinutes} minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
            `,
        });

        return { status: 'processed' };
    }
}
