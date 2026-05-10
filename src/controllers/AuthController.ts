import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { Hash } from '@/core/utils/Hash';
import { User } from '@/core/models/User';
import { PasswordReset } from '@/core/models/PasswordReset';
import { Session } from '@/core/models/Session';
import { Mailer } from '../lib/mail';
import { Emitter } from '../lib/events';
import { z } from 'zod';
import crypto from 'crypto';
import variables from '../config/variables';

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
            const em = req.entityManager;

            const user = await em.findOne(User, { email: validatedData.email });

            if (!user || !(await Hash.check(validatedData.password, user.password))) {
                return controller.render('Auth/Login', {
                    errors: { email: 'Invalid credentials' }
                });
            }

            await req.authenticate(user);
            Emitter.emit('user.login', { id: user.id, email: user.email });
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
            const em = req.orm.em;

            const existingUser = await em.findOne(User, { email: validatedData.email });
            if (existingUser) {
                return controller.render('Auth/Register', {
                    errors: { email: 'Email already taken' }
                });
            }

            const hashedPassword = await Hash.make(validatedData.password);

            const user = new User(
                crypto.randomUUID(),
                validatedData.name,
                validatedData.email,
                hashedPassword
            );

            await em.persistAndFlush(user);
            Emitter.emit('user.registered', { id: user.id, email: user.email });

            const token = makeVerificationToken(user.id, user.email);
            const appUrl = variables.APP_URL;
            const verifyUrl = `${appUrl}/verify-email/${token}`;
            const html = `
                <p>Welcome to ${variables.APP_NAME}!</p>
                <p><a href="${verifyUrl}">Click here to verify your email address</a></p>
                <p>If you did not create an account, please ignore this email.</p>
            `;
            await Mailer.send(user.email, 'Verify your email address', html);

            await req.authenticate(user);
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
            const em = req.entityManager;
            const user = await em.findOne(User, { email });

            // Always respond with success to prevent email enumeration
            if (user) {
                const rawToken = crypto.randomBytes(32).toString('hex');
                const tokenHash = crypto
                    .createHmac('sha256', variables.APP_KEY)
                    .update(rawToken)
                    .digest('hex');

                // Upsert: delete any existing reset for this email, then insert
                await em.nativeDelete(PasswordReset, { email });
                const reset = em.create(PasswordReset, { email, tokenHash, createdAt: new Date() });
                await em.persistAndFlush(reset);

                const appUrl = variables.APP_URL;
                const resetUrl = `${appUrl}/reset-password/${rawToken}?email=${encodeURIComponent(email)}`;
                const html = `
                    <p>You requested a password reset for your account.</p>
                    <p><a href="${resetUrl}">Click here to reset your password</a></p>
                    <p>This link expires in ${variables.PASSWORD_RESET_EXPIRY} minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                `;

                await Mailer.send(email, 'Password Reset Request', html);
            }

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
            const em = req.entityManager;

            const tokenHash = crypto
                .createHmac('sha256', variables.APP_KEY)
                .update(validated.token)
                .digest('hex');

            const reset = await em.findOne(PasswordReset, { email: validated.email, tokenHash });

            if (!reset) {
                return renderError({ token: ['This password reset link is invalid.'] });
            }

            const expiryMs = variables.PASSWORD_RESET_EXPIRY * 60 * 1000;
            if (Date.now() - reset.createdAt.getTime() > expiryMs) {
                await em.nativeDelete(PasswordReset, { email: validated.email });
                return renderError({ token: ['This password reset link has expired. Please request a new one.'] });
            }

            const user = await em.findOne(User, { email: validated.email });
            if (!user) {
                return renderError({ token: ['This password reset link is invalid.'] });
            }

            user.password = await Hash.make(validated.password);
            await em.nativeDelete(PasswordReset, { email: validated.email });
            // Invalidate all sessions for this user
            await em.nativeDelete(Session, { user_id: user.id });
            await em.flush();

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

        const em = req.entityManager;
        const user = await em.findOne(User, { id: payload.id, email: payload.email });
        if (!user) {
            return controller.render('Auth/VerifyEmail', {
                errors: { email: ['This verification link is invalid.'] }
            });
        }

        if (!user.emailVerifiedAt) {
            user.emailVerifiedAt = new Date();
            await em.flush();
            Emitter.emit('user.verified', { id: user.id, email: user.email });
        }

        return res.redirect('/home');
    }

    static async resendVerification(req: Request, res: Response) {
        const controller = new AuthController(req, res);
        const user = await req.user();

        if (!user) {
            return res.redirect('/login');
        }

        if (user.emailVerifiedAt) {
            return controller.render('Auth/VerifyEmail', {
                email: user.email,
                status: 'Your email is already verified.'
            });
        }

        const token = makeVerificationToken(user.id, user.email);
        const appUrl = variables.APP_URL;
        const verifyUrl = `${appUrl}/verify-email/${token}`;
        const html = `
            <p>Please verify your email address.</p>
            <p><a href="${verifyUrl}">Click here to verify your email address</a></p>
            <p>If you did not create an account, please ignore this email.</p>
        `;
        await Mailer.send(user.email, 'Verify your email address', html);

        return controller.render('Auth/VerifyEmail', {
            email: user.email,
            status: 'A new verification link has been sent to your email address.'
        });
    }
}
