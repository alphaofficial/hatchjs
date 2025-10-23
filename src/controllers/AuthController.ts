import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { Hash } from '../utils/Hash';
import { User } from '../models/User';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

const registerSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    password_confirmation: z.string().min(8)
}).refine(data => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"]
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
            const em = req.orm.em;

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
}