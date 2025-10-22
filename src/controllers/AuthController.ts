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

    public async showLogin(req: Request, res: Response) {
        return this.render(req, res, 'Auth/Login');
    }

    public async showRegister(req: Request, res: Response) {
        return this.render(req, res, 'Auth/Register');
    }

    public async login(req: Request, res: Response) {
        try {
            const validatedData = loginSchema.parse(req.body);
            const em = req.orm.em;

            const user = await em.findOne(User, { email: validatedData.email });

            if (!user || !(await Hash.check(validatedData.password, user.password))) {
                return this.render(req, res, 'Auth/Login', {
                    errors: { email: 'Invalid credentials' }
                });
            }

            req.authenticate(user);
            return res.redirect('/dashboard');

        } catch (error) {
            if (error instanceof z.ZodError) {
                return this.render(req, res, 'Auth/Login', {
                    errors: error.flatten().fieldErrors
                });
            }
            throw error;
        }
    }

    public async register(req: Request, res: Response) {
        try {
            const validatedData = registerSchema.parse(req.body);
            const em = req.orm.em;

            const existingUser = await em.findOne(User, { email: validatedData.email });
            if (existingUser) {
                return this.render(req, res, 'Auth/Register', {
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
            return res.redirect('/dashboard');

        } catch (error) {
            if (error instanceof z.ZodError) {
                return this.render(req, res, 'Auth/Register', {
                    errors: error.flatten().fieldErrors
                });
            }
            throw error;
        }
    }

    public async logout(req: Request, res: Response) {
        try {
            await req.logout();
            res.redirect('/login');
        } catch (err: any) {
            console.error('Session destruction error:', err);
            res.redirect('/login');
        }
    }

    public async dashboard(req: Request, res: Response) {
        return this.render(req, res, 'Auth/Dashboard');
    }
}