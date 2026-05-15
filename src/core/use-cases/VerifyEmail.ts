import type { AppEvents } from '@/core/events/AppEvents';
import { User } from '@/core/models/User';
import type { UserRepository } from '@/ports/user-repository';

export interface VerifyEmailInput {
    id: string;
    email: string;
}

export type VerifyEmailResult =
    | { status: 'invalid_user' }
    | { status: 'verified' };

type VerifyEmailEmitter = <K extends keyof AppEvents>(event: K, payload: AppEvents[K]) => boolean | void;

export interface VerifyEmailDependencies {
    users: Pick<UserRepository, 'findOne' | 'flush'>;
    emit: VerifyEmailEmitter;
    now: () => Date;
}

export class VerifyEmail {
    private readonly users: VerifyEmailDependencies['users'];
    private readonly emit: VerifyEmailEmitter;
    private readonly now: () => Date;

    constructor({ users, emit, now }: VerifyEmailDependencies) {
        this.users = users;
        this.emit = emit;
        this.now = now;
    }

    async execute(input: VerifyEmailInput): Promise<VerifyEmailResult> {
        const user = await this.users.findOne(User, {
            id: input.id,
            email: input.email,
        });

        if (!user) {
            return { status: 'invalid_user' };
        }

        if (!user.emailVerifiedAt) {
            user.emailVerifiedAt = this.now();
            await this.users.flush();
            this.emit('user.verified', { id: user.id, email: user.email });
        }

        return { status: 'verified' };
    }
}
