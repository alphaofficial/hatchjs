import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ForgotPassword } from '@/core/use-cases/ForgotPassword';
import { LoginUser } from '@/core/use-cases/LoginUser';
import { RegisterUser } from '@/core/use-cases/RegisterUser';
import { ResendVerification } from '@/core/use-cases/ResendVerification';
import { ResetPassword } from '@/core/use-cases/ResetPassword';
import { VerifyEmail } from '@/core/use-cases/VerifyEmail';
import { Mailer } from '@/lib/mail';
import { Emitter } from '@/lib/events';
import { z } from 'zod';
import crypto from 'crypto';
import variables from '@/config/variables';
import type { MailTransport } from '@/ports/mail';
import type { UserRepository } from '@/ports/user-repository';

// ---- email-verification token helpers ----

function makeVerificationToken(userId: string, email: string): string {
    const payload = Buffer.from(JSON.stringify({ id: userId, email, iat: Date.now() })).toString('base64url');
    const sig = crypto.createHmac('sha256', variables.APP_KEY).update(payload).digest('hex');
    return `${payload}.${sig}`;
}

interface VerificationPayload {
    id: string;
    email: string;
    iat: number;
}

function verifyVerificationToken(token: string): VerificationPayload | null {
    const dot = token.lastIndexOf('.');
    if (dot < 0) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = crypto.createHmac('sha256', variables.APP_KEY).update(payload).digest('hex');
    const sigBuf = Buffer.from(sig, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    try {
        return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as VerificationPayload;
    } catch {
        return null;
    }
}

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1)
});

const registerSchema = z.object({
    name: z.string().min(1),
    email: z.email(),
    password: z.string().min(8),
    password_confirmation: z.string().min(8)
}).refine(data => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"]
});

const forgotPasswordSchema = z.object({
    email: z.email()
});

const resetPasswordSchema = z.object({
    token: z.string().min(1),
    email: z.email(),
    password: z.string().min(8),
    password_confirmation: z.string().min(8)
}).refine(data => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"]
});

export class AuthController extends BaseController {

    static async showLogin(req: Request, res: Response) {
        const controller = new AuthController(req, res);
        const status = req.query.reset === '1' ? 'Your password has been reset. You may now sign in.' : undefined;
        return controller.render('Auth/Login', { status });
    }

    static async showRegister(req: Request, res: Response) {
        return new AuthController(req, res).render('Auth/Register');
    }

    static async login(req: Request, res: Response) {
        const controller = new AuthController(req, res);

        try {
            const validatedData = loginSchema.parse(req.body);
            const loginUser = new LoginUser({
                users: createUserRepository(req.orm.em),
                emit: Emitter.emit.bind(Emitter),
            });
            const result = await loginUser.execute(validatedData);

            if (result.status === 'invalid_credentials') {
                return controller.render('Auth/Login', {
                    errors: { email: 'Invalid credentials' }
                });
            }

            await req.authenticate(result.user);
            return res.redirect('/home');

        } catch (error) {
            if (error instanceof z.ZodError) {
                return controller.render('Auth/Login', {
                    errors: error.flatten().fieldErrors
                });
            }
            throw error;
        }
    }

    static async register(req: Request, res: Response) {
        const controller = new AuthController(req, res);

        try {
            const validatedData = registerSchema.parse(req.body);
            const registerUser = new RegisterUser({
                users: createUserRepository(req.orm.em),
                mailTransport: createMailTransport(),
                emit: Emitter.emit.bind(Emitter),
                appName: variables.APP_NAME,
                appUrl: variables.APP_URL,
                uuid: crypto.randomUUID,
                makeVerificationToken: user => makeVerificationToken(user.id, user.email),
            });

            const result = await registerUser.execute({
                name: validatedData.name,
                email: validatedData.email,
                password: validatedData.password,
            });

            if (result.status === 'email_taken') {
                return controller.render('Auth/Register', {
                    errors: { email: 'Email already taken' }
                });
            }

            await req.authenticate(result.user);
            return res.redirect('/verify-email');

        } catch (error) {
            if (error instanceof z.ZodError) {
                return controller.render('Auth/Register', {
                    errors: error.flatten().fieldErrors
                });
            }
            throw error;
        }
    }

    static async logout(req: Request, res: Response) {
        try {
            await req.logout();
            res.redirect('/login');
        } catch (err: any) {
            console.error('Session destruction error:', err);
            res.redirect('/login');
        }
    }

    static async dashboard(req: Request, res: Response) {
        const user = await req.user();
        return new AuthController(req, res).render('Dashboard', { user });
    }

    static async showForgotPassword(req: Request, res: Response) {
        return new AuthController(req, res).render('Auth/ForgotPassword');
    }

    static async forgotPassword(req: Request, res: Response) {
        const controller = new AuthController(req, res);

        try {
            const { email } = forgotPasswordSchema.parse(req.body);
            const forgotPassword = new ForgotPassword({
                users: createUserRepository(req.entityManager),
                mailTransport: createMailTransport(),
                appUrl: variables.APP_URL,
                passwordResetExpiryMinutes: variables.PASSWORD_RESET_EXPIRY,
                createResetToken: () => {
                    const rawToken = crypto.randomBytes(32).toString('hex');
                    const tokenHash = crypto
                        .createHmac('sha256', variables.APP_KEY)
                        .update(rawToken)
                        .digest('hex');

                    return { rawToken, tokenHash };
                },
                now: () => new Date(),
            });

            await forgotPassword.execute({ email });

            return controller.render('Auth/ForgotPassword', {
                status: 'We have emailed your password reset link!'
            });

        } catch (error) {
            if (error instanceof z.ZodError) {
                return controller.render('Auth/ForgotPassword', {
                    errors: error.flatten().fieldErrors
                });
            }
            throw error;
        }
    }

    static async showResetPassword(req: Request, res: Response) {
        return new AuthController(req, res).render('Auth/ResetPassword', {
            token: req.params.token,
            email: req.query.email as string ?? ''
        });
    }

    static async resetPassword(req: Request, res: Response) {
        const controller = new AuthController(req, res);

        const renderError = (errors: Record<string, string[]>) =>
            controller.render('Auth/ResetPassword', {
                token: req.body.token ?? '',
                email: req.body.email ?? '',
                errors
            });

        try {
            const validated = resetPasswordSchema.parse(req.body);
            const resetPassword = new ResetPassword({
                users: createUserRepository(req.entityManager),
                passwordResetExpiryMinutes: variables.PASSWORD_RESET_EXPIRY,
                makeTokenHash: token => crypto
                    .createHmac('sha256', variables.APP_KEY)
                    .update(token)
                    .digest('hex'),
                now: () => new Date(),
            });

            const result = await resetPassword.execute(validated);

            if (result.status === 'invalid_token') {
                return renderError({ token: ['This password reset link is invalid.'] });
            }

            if (result.status === 'expired_token') {
                return renderError({ token: ['This password reset link has expired. Please request a new one.'] });
            }

            return res.redirect('/login?reset=1');

        } catch (error) {
            if (error instanceof z.ZodError) {
                return renderError(error.flatten().fieldErrors as Record<string, string[]>);
            }
            throw error;
        }
    }

    static async showVerifyEmail(req: Request, res: Response) {
        const user = await req.user();
        return new AuthController(req, res).render('Auth/VerifyEmail', { email: user?.email });
    }

    static async verifyEmail(req: Request, res: Response) {
        const controller = new AuthController(req, res);
        const { token } = req.params;
        const payload = verifyVerificationToken(token);

        if (!payload) {
            return controller.render('Auth/VerifyEmail', {
                errors: { email: ['This verification link is invalid.'] }
            });
        }

        const expiryMs = variables.EMAIL_VERIFICATION_EXPIRY * 60 * 1000;
        if (Date.now() - payload.iat > expiryMs) {
            const user = await req.user();
            return controller.render('Auth/VerifyEmail', {
                email: user?.email,
                errors: { email: ['This verification link has expired. Please request a new one.'] }
            });
        }

        const verifyEmail = new VerifyEmail({
            users: createUserRepository(req.entityManager),
            emit: Emitter.emit.bind(Emitter),
            now: () => new Date(),
        });

        const result = await verifyEmail.execute({
            id: payload.id,
            email: payload.email,
        });

        if (result.status === 'invalid_user') {
            return controller.render('Auth/VerifyEmail', {
                errors: { email: ['This verification link is invalid.'] }
            });
        }

        return res.redirect('/home');
    }

    static async resendVerification(req: Request, res: Response) {
        const controller = new AuthController(req, res);
        const user = await req.user();

        if (!user) {
            return res.redirect('/login');
        }

        const resendVerification = new ResendVerification({
            mailTransport: createMailTransport(),
            appUrl: variables.APP_URL,
            makeVerificationToken: currentUser => makeVerificationToken(currentUser.id, currentUser.email),
        });

        const result = await resendVerification.execute({ user });

        if (result.status === 'already_verified') {
            return controller.render('Auth/VerifyEmail', {
                email: user.email,
                status: 'Your email is already verified.'
            });
        }

        return controller.render('Auth/VerifyEmail', {
            email: user.email,
            status: 'A new verification link has been sent to your email address.'
        });
    }
}

function createUserRepository(
    entityManager: Request['orm']['em']
): Pick<UserRepository, 'findOne' | 'persistAndFlush' | 'nativeDelete' | 'flush'> {
    return {
        findOne: (entity, where) => entityManager.findOne(entity, where),
        persistAndFlush: entity => entityManager.persistAndFlush(entity),
        nativeDelete: (entity, where) => entityManager.nativeDelete(entity, where),
        flush: () => entityManager.flush(),
    };
}

function createMailTransport(): MailTransport {
    return {
        sendMail: ({ to, subject, html }) => Mailer.send(to, subject, html),
    };
}
