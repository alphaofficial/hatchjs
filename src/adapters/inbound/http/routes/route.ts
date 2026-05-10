import { Router } from 'express';
import { PublicController } from '@/adapters/inbound/http/controllers/PublicController';
import { AboutController } from '@/adapters/inbound/http/controllers/AboutController';
import { UserController } from '@/adapters/inbound/http/controllers/UserController';
import { AuthController } from '@/adapters/inbound/http/controllers/AuthController';
import { InertiaExpressMiddleware } from '@/adapters/inbound/http/middleware/inertia';
import { auth, guest } from '@/adapters/inbound/http/middleware/auth';
import { authRateLimit, featureRateLimit } from '@/adapters/inbound/http/middleware/rateLimit';

interface RouteControllers {
    publicController: PublicController;
    aboutController: AboutController;
    userController: UserController;
    authController: AuthController;
}

export function createRoutes({
    publicController,
    aboutController,
    userController,
    authController,
}: RouteControllers) {
    const route = Router();

    // Apply Inertia middleware to all routes
    route.use(InertiaExpressMiddleware.apply);

    // Apply rate limiter once to all sensitive auth POSTs
    route.post(['/login', '/register', '/forgot-password', '/reset-password'], authRateLimit());
    route.post('/email/resend-verification', featureRateLimit());

    // Guest routes (only accessible when not authenticated)
    route.get('/login', guest, authController.showLogin);
    route.post('/login', guest, authController.login);
    route.get('/register', guest, authController.showRegister);
    route.post('/register', guest, authController.register);
    route.get('/forgot-password', guest, authController.showForgotPassword);
    route.post('/forgot-password', guest, authController.forgotPassword);
    route.get('/reset-password/:token', guest, authController.showResetPassword);
    route.post('/reset-password', guest, authController.resetPassword);

    // Email verification routes (require auth, not necessarily verified)
    route.get('/verify-email', auth, authController.showVerifyEmail);
    route.get('/verify-email/:token', auth, authController.verifyEmail);
    route.post('/email/resend-verification', auth, authController.resendVerification);

    // Public routes
    route.get('/', publicController.index);

    // Protected routes (require authentication)
    route.get('/about', auth, aboutController.index);
    route.get('/home', auth, authController.dashboard);
    route.post('/logout', auth, authController.logout);
    route.get('/users', auth, userController.index);
    route.get('/users/:id', auth, userController.show);

    return route;
}
