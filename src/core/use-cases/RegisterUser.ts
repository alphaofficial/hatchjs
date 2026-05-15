import type { AppEvents } from '@/core/events/AppEvents';
import { User } from '@/core/models/User';
import type { Hasher } from '@/ports/hasher';
import type { MailTransport } from '@/ports/mail';
import type { UserRepository } from '@/ports/user-repository';

export interface RegisterUserInput {
    name: string;
    email: string;
    password: string;
}

export type RegisterUserResult =
    | { status: 'email_taken' }
    | { status: 'registered'; user: User };

type RegisterUserEmitter = <K extends keyof AppEvents>(event: K, payload: AppEvents[K]) => boolean | void;

export interface RegisterUserDependencies {
    users: Pick<UserRepository, 'findOne' | 'persistAndFlush'>;
    hasher: Hasher;
    mailTransport: MailTransport;
    emit: RegisterUserEmitter;
    appName: string;
    appUrl: string;
    uuid: () => string;
    makeVerificationToken: (user: Pick<User, 'id' | 'email'>) => string;
}

export class RegisterUser {
    private readonly users: RegisterUserDependencies['users'];
    private readonly hasher: Hasher;
    private readonly mailTransport: MailTransport;
    private readonly emit: RegisterUserEmitter;
    private readonly appName: string;
    private readonly appUrl: string;
    private readonly uuid: () => string;
    private readonly makeVerificationToken: RegisterUserDependencies['makeVerificationToken'];

    constructor({
        users,
        hasher,
        mailTransport,
        emit,
        appName,
        appUrl,
        uuid,
        makeVerificationToken,
    }: RegisterUserDependencies) {
        this.users = users;
        this.hasher = hasher;
        this.mailTransport = mailTransport;
        this.emit = emit;
        this.appName = appName;
        this.appUrl = appUrl;
        this.uuid = uuid;
        this.makeVerificationToken = makeVerificationToken;
    }

    async execute(input: RegisterUserInput): Promise<RegisterUserResult> {
        const existingUser = await this.users.findOne(User, { email: input.email });

        if (existingUser) {
            return { status: 'email_taken' };
        }

        const hashedPassword = await this.hasher.make(input.password);
        const user = new User(this.uuid(), input.name, input.email, hashedPassword);

        await this.users.persistAndFlush(user);
        this.emit('user.registered', { id: user.id, email: user.email });

        const verificationToken = this.makeVerificationToken(user);
        const verifyUrl = `${this.appUrl}/verify-email/${verificationToken}`;

        await this.mailTransport.sendMail({
            to: user.email,
            subject: 'Verify your email address',
            html: `
                <p>Welcome to ${this.appName}!</p>
                <p><a href="${verifyUrl}">Click here to verify your email address</a></p>
                <p>If you did not create an account, please ignore this email.</p>
            `,
        });

        return { status: 'registered', user };
    }
}
