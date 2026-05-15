import { PasswordReset } from '@/core/models/PasswordReset';
import { Session } from '@/core/models/Session';
import { User } from '@/core/models/User';
import type { Hasher } from '@/ports/hasher';
import type { UserRepository } from '@/ports/user-repository';

export interface ResetPasswordInput {
    token: string;
    email: string;
    password: string;
}

export type ResetPasswordResult =
    | { status: 'invalid_token' }
    | { status: 'expired_token' }
    | { status: 'password_reset' };

export interface ResetPasswordDependencies {
    users: Pick<UserRepository, 'findOne' | 'nativeDelete' | 'flush'>;
    hasher: Hasher;
    passwordResetExpiryMinutes: number;
    makeTokenHash: (token: string) => string;
    now: () => Date;
}

export class ResetPassword {
    private readonly users: ResetPasswordDependencies['users'];
    private readonly hasher: Hasher;
    private readonly passwordResetExpiryMinutes: number;
    private readonly makeTokenHash: ResetPasswordDependencies['makeTokenHash'];
    private readonly now: () => Date;

    constructor({
        users,
        hasher,
        passwordResetExpiryMinutes,
        makeTokenHash,
        now,
    }: ResetPasswordDependencies) {
        this.users = users;
        this.hasher = hasher;
        this.passwordResetExpiryMinutes = passwordResetExpiryMinutes;
        this.makeTokenHash = makeTokenHash;
        this.now = now;
    }

    async execute(input: ResetPasswordInput): Promise<ResetPasswordResult> {
        const tokenHash = this.makeTokenHash(input.token);
        const reset = await this.users.findOne(PasswordReset, { email: input.email, tokenHash });

        if (!reset) {
            return { status: 'invalid_token' };
        }

        const expiryMs = this.passwordResetExpiryMinutes * 60 * 1000;
        if (this.now().getTime() - reset.createdAt.getTime() > expiryMs) {
            await this.users.nativeDelete(PasswordReset, { email: input.email });
            return { status: 'expired_token' };
        }

        const user = await this.users.findOne(User, { email: input.email });
        if (!user) {
            return { status: 'invalid_token' };
        }

        user.password = await this.hasher.make(input.password);
        await this.users.nativeDelete(PasswordReset, { email: input.email });
        await this.users.nativeDelete(Session, { user_id: user.id });
        await this.users.flush();

        return { status: 'password_reset' };
    }
}
