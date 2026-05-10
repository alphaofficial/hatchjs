import type { AppEvents } from '@/core/events/AppEvents';
import { User } from '@/core/models/User';
import { Hash } from '@/core/utils/Hash';
import type { UserRepository } from '@/ports/user-repository';

export interface LoginUserInput {
    email: string;
    password: string;
}

export type LoginUserResult =
    | { status: 'invalid_credentials' }
    | { status: 'authenticated'; user: User };

type LoginUserEmitter = <K extends keyof AppEvents>(event: K, payload: AppEvents[K]) => boolean | void;

export interface LoginUserDependencies {
    users: Pick<UserRepository, 'findOne'>;
    emit: LoginUserEmitter;
}

export class LoginUser {
    private readonly users: LoginUserDependencies['users'];
    private readonly emit: LoginUserEmitter;

    constructor({ users, emit }: LoginUserDependencies) {
        this.users = users;
        this.emit = emit;
    }

    async execute(input: LoginUserInput): Promise<LoginUserResult> {
        const user = await this.users.findOne(User, { email: input.email });

        if (!user || !(await Hash.check(input.password, user.password))) {
            return { status: 'invalid_credentials' };
        }

        this.emit('user.login', { id: user.id, email: user.email });
        return { status: 'authenticated', user };
    }
}
