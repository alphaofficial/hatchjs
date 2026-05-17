import { Router } from 'express';
import { PublicController } from '../controllers/PublicController';
import { AboutController } from '../controllers/AboutController';
import { UserController } from '../controllers/UserController';
import { AuthController } from '../controllers/AuthController';
import { InertiaExpressMiddleware } from '../middleware/inertia';
import { auth, guest, verified } from '../middleware/auth';
import { authRateLimit, featureRateLimit } from '../middleware/rateLimit';

const route = Router();

// Apply Inertia middleware to all routes
route.use(InertiaExpressMiddleware.apply);

// Apply rate limiter once to all sensitive auth POSTs
route.post(['/login', '/register', '/forgot-password', '/reset-password'], authRateLimit());
route.post('/email/resend-verification', featureRateLimit());

// Guest routes (only accessible when not authenticated)
route.get('/login', guest, AuthController.showLogin);
route.post('/login', guest, AuthController.login);
route.get('/register', guest, AuthController.showRegister);
route.post('/register', guest, AuthController.register);
route.get('/forgot-password', guest, AuthController.showForgotPassword);
route.post('/forgot-password', guest, AuthController.forgotPassword);
route.get('/reset-password/:token', guest, AuthController.showResetPassword);
route.post('/reset-password', guest, AuthController.resetPassword);

// Email verification routes (require auth, not necessarily verified)
route.get('/verify-email', auth, AuthController.showVerifyEmail);
route.get('/verify-email/:token', auth, AuthController.verifyEmail);
route.post('/email/resend-verification', auth, AuthController.resendVerification);

// Public routes
route.get('/', PublicController.index);

// Protected routes (require authentication)
route.get('/about', auth, AboutController.index);
route.get('/home', auth, AuthController.dashboard);
route.post('/logout', auth, AuthController.logout);
route.get('/users', auth, UserController.index);
route.get('/users/:id', auth, UserController.show);

export default route;