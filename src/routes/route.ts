import { Router } from 'express';
import { PublicController } from '../controllers/PublicController';
import { AboutController } from '../controllers/AboutController';
import { UserController } from '../controllers/UserController';
import { AuthController } from '../controllers/AuthController';
import { InertiaExpressMiddleware } from '../middleware/inertia';
import { auth, guest } from '../middleware/auth';

const route = Router();
const authController = new AuthController();

// Apply Inertia middleware to all routes
route.use(InertiaExpressMiddleware.apply);

// Guest routes (only accessible when not authenticated)
route.get('/login', guest, authController.showLogin.bind(authController));
route.post('/login', guest, authController.login.bind(authController));
route.get('/register', guest, authController.showRegister.bind(authController));
route.post('/register', guest, authController.register.bind(authController));

// Public routes
route.get('/', PublicController.index);
route.get('/about', AboutController.index);

// Protected routes (require authentication)
route.get('/dashboard', auth, authController.dashboard.bind(authController));
route.post('/logout', auth, authController.logout.bind(authController));
route.get('/users', auth, UserController.index);
route.get('/users/:id', auth, UserController.show);

export default route;