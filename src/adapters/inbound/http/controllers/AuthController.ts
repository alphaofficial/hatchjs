import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ForgotPassword } from '@/core/use-cases/ForgotPassword';
import { LoginUser } from '@/core/use-cases/LoginUser';
import { RegisterUser } from '@/core/use-cases/RegisterUser';
import { ResendVerification } from '@/core/use-cases/ResendVerification';
import { ResetPassword } from '@/core/use-cases/ResetPassword';
import { VerifyEmail } from '@/core/use-cases/VerifyEmail';
import { z } from 'zod';

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

interface VerificationPayload {
    id: string;
    email: string;
}

type VerificationTokenResult =
    | { status: 'invalid' }
    | { status: 'expired' }
    | { status: 'valid'; payload: VerificationPayload };

interface AuthControllerDependencies {
    loginUser: LoginUser;
    registerUser: RegisterUser;
    forgotPassword: ForgotPassword;
    resetPassword: ResetPassword;
    verifyEmail: VerifyEmail;
    resendVerification: ResendVerification;
    readVerificationToken: (token: string) => VerificationTokenResult;
}

export class AuthController {
    constructor(
        private readonly loginUserUseCase: LoginUser,
        private readonly registerUserUseCase: RegisterUser,
        private readonly forgotPasswordUseCase: ForgotPassword,
        private readonly resetPasswordUseCase: ResetPassword,
        private readonly verifyEmailUseCase: VerifyEmail,
        private readonly resendVerificationUseCase: ResendVerification,
        private readonly readVerificationToken: AuthControllerDependencies['readVerificationToken'],
    ) {}

    static fromDependencies(dependencies: AuthControllerDependencies): AuthController {
        return new AuthController(
            dependencies.loginUser,
            dependencies.registerUser,
            dependencies.forgotPassword,
            dependencies.resetPassword,
            dependencies.verifyEmail,
            dependencies.resendVerification,
            dependencies.readVerificationToken,
        );
    }

    private render(
        req: Request,
        res: Response,
        componentName: Parameters<BaseController['render']>[0],
        componentProps: Parameters<BaseController['render']>[1] = {},
    ) {
        return new BaseController(req, res).render(componentName, componentProps);
    }

    showLogin = async (req: Request, res: Response) => {
        const status = req.query.reset === '1' ? 'Your password has been reset. You may now sign in.' : undefined;
        return this.render(req, res, 'Auth/Login', { status });
    };

    showRegister = async (req: Request, res: Response) => this.render(req, res, 'Auth/Register');

    login = async (req: Request, res: Response) => {
        try {
            const validatedData = loginSchema.parse(req.body);
            const result = await this.loginUserUseCase.execute(validatedData);

            if (result.status === 'invalid_credentials') {
                return this.render(req, res, 'Auth/Login', {
                    errors: { email: 'Invalid credentials' }
                });
            }

            await req.authenticate(result.user);
            return res.redirect('/home');

        } catch (error) {
            if (error instanceof z.ZodError) {
                return this.render(req, res, 'Auth/Login', {
                    errors: error.flatten().fieldErrors
                });
            }
            throw error;
        }
    };

    register = async (req: Request, res: Response) => {
        try {
            const validatedData = registerSchema.parse(req.body);
            const result = await this.registerUserUseCase.execute({
                name: validatedData.name,
                email: validatedData.email,
                password: validatedData.password,
            });

            if (result.status === 'email_taken') {
                return this.render(req, res, 'Auth/Register', {
                    errors: { email: 'Email already taken' }
                });
            }

            await req.authenticate(result.user);
            return res.redirect('/verify-email');

        } catch (error) {
            if (error instanceof z.ZodError) {
                return this.render(req, res, 'Auth/Register', {
                    errors: error.flatten().fieldErrors
                });
            }
            throw error;
        }
    };

    logout = async (req: Request, res: Response) => {
        try {
            await req.logout();
            res.redirect('/login');
        } catch (err: any) {
            console.error('Session destruction error:', err);
            res.redirect('/login');
        }
    };

    dashboard = async (req: Request, res: Response) => {
        const user = await req.user();
        return this.render(req, res, 'Dashboard', { user });
    };

    showForgotPassword = async (req: Request, res: Response) => this.render(req, res, 'Auth/ForgotPassword');

    forgotPassword = async (req: Request, res: Response) => {
        try {
            const { email } = forgotPasswordSchema.parse(req.body);
            await this.forgotPasswordUseCase.execute({ email });

            return this.render(req, res, 'Auth/ForgotPassword', {
                status: 'We have emailed your password reset link!'
            });

        } catch (error) {
            if (error instanceof z.ZodError) {
                return this.render(req, res, 'Auth/ForgotPassword', {
                    errors: error.flatten().fieldErrors
                });
            }
            throw error;
        }
    };

    showResetPassword = async (req: Request<{ token: string }>, res: Response) => {
        return this.render(req, res, 'Auth/ResetPassword', {
            token: req.params.token,
            email: req.query.email as string ?? ''
        });
    };

    resetPassword = async (req: Request, res: Response) => {
        const renderError = (errors: Record<string, string[]>) =>
            this.render(req, res, 'Auth/ResetPassword', {
                token: req.body.token ?? '',
                email: req.body.email ?? '',
                errors
            });

        try {
            const validated = resetPasswordSchema.parse(req.body);
            const result = await this.resetPasswordUseCase.execute(validated);

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
    };

    showVerifyEmail = async (req: Request, res: Response) => {
        const user = await req.user();
        return this.render(req, res, 'Auth/VerifyEmail', { email: user?.email });
    };

    verifyEmail = async (req: Request<{ token: string }>, res: Response) => {
        const tokenResult = this.readVerificationToken(req.params.token);

        if (tokenResult.status === 'invalid') {
            return this.render(req, res, 'Auth/VerifyEmail', {
                errors: { email: ['This verification link is invalid.'] }
            });
        }

        if (tokenResult.status === 'expired') {
            const user = await req.user();
            return this.render(req, res, 'Auth/VerifyEmail', {
                email: user?.email,
                errors: { email: ['This verification link has expired. Please request a new one.'] }
            });
        }

        const result = await this.verifyEmailUseCase.execute({
            id: tokenResult.payload.id,
            email: tokenResult.payload.email,
        });

        if (result.status === 'invalid_user') {
            return this.render(req, res, 'Auth/VerifyEmail', {
                errors: { email: ['This verification link is invalid.'] }
            });
        }

        return res.redirect('/home');
    };

    resendVerification = async (req: Request, res: Response) => {
        const user = await req.user();

        if (!user) {
            return res.redirect('/login');
        }

        const result = await this.resendVerificationUseCase.execute({ user });

        if (result.status === 'already_verified') {
            return this.render(req, res, 'Auth/VerifyEmail', {
                email: user.email,
                status: 'Your email is already verified.'
            });
        }

        return this.render(req, res, 'Auth/VerifyEmail', {
            email: user.email,
            status: 'A new verification link has been sent to your email address.'
        });
    };
}
