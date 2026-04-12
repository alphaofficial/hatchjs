import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { Hash } from '../utils/Hash';
import { User } from '../models/User';
import { PasswordReset } from '../models/PasswordReset';
import { sendMail } from '../lib/mail';
import { z } from 'zod';
import crypto from 'crypto';
import variables from '../config/variables';

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

export class AuthController extends BaseController {

    static async showLogin(req: Request, res: Response) {
        const instance = new AuthController();
        return instance.render(req, res, 'Auth/Login');
    }

    static async showRegister(req: Request, res: Response) {
        const instance = new AuthController();
        return instance.render(req, res, 'Auth/Register');
    }

    static async login(req: Request, res: Response) {
        const instance = new AuthController();

        try {
            const validatedData = loginSchema.parse(req.body);
            const em = req.entityManager;

            const user = await em.findOne(User, { email: validatedData.email });

            if (!user || !(await Hash.check(validatedData.password, user.password))) {
                return instance.render(req, res, 'Auth/Login', {
                    errors: { email: 'Invalid credentials' }
                });
            }

            req.authenticate(user);
            return res.redirect('/home');

        } catch (error) {
            if (error instanceof z.ZodError) {
                return instance.render(req, res, 'Auth/Login', {
                    errors: error.flatten().fieldErrors
                });
            }
            throw error;
        }
    }

    static async register(req: Request, res: Response) {
        const instance = new AuthController();

        try {
            const validatedData = registerSchema.parse(req.body);
            const em = req.orm.em;

            const existingUser = await em.findOne(User, { email: validatedData.email });
            if (existingUser) {
                return instance.render(req, res, 'Auth/Register', {
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

            req.authenticate(user);
            return res.redirect('/home');

        } catch (error) {
            if (error instanceof z.ZodError) {
                return instance.render(req, res, 'Auth/Register', {
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
        const instance = new AuthController();
        const user = await req.user();
        return instance.render(req, res, 'Dashboard', { user });
    }

    static async showForgotPassword(req: Request, res: Response) {
        const instance = new AuthController();
        return instance.render(req, res, 'Auth/ForgotPassword');
    }

    static async forgotPassword(req: Request, res: Response) {
        const instance = new AuthController();

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

                await sendMail(email, 'Password Reset Request', html);
            }

            return instance.render(req, res, 'Auth/ForgotPassword', {
                status: 'We have emailed your password reset link!'
            });

        } catch (error) {
            if (error instanceof z.ZodError) {
                return instance.render(req, res, 'Auth/ForgotPassword', {
                    errors: error.flatten().fieldErrors
                });
            }
            throw error;
        }
    }
}