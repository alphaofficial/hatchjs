import { Router } from 'express';
import { PublicController } from '../controllers/PublicController';
import { AboutController } from '../controllers/AboutController';
import { UserController } from '../controllers/UserController';
import { AuthController } from '../controllers/AuthController';
import { InertiaExpressMiddleware } from '../middleware/inertia';
import { auth, guest } from '../middleware/auth';

const route = Router();

// Apply Inertia middleware to all routes
route.use(InertiaExpressMiddleware.apply);

// Guest routes (only accessible when not authenticated)
route.get('/login', guest, AuthController.showLogin);
route.post('/login', guest, AuthController.login);
route.get('/register', guest, AuthController.showRegister);
route.post('/register', guest, AuthController.register);

// Public routes
route.get('/', PublicController.index);

// Protected routes (require authentication)
route.get('/about', auth, AboutController.index);
route.get('/home', auth, AuthController.dashboard);
route.post('/logout', auth, AuthController.logout);
route.get('/users', auth, UserController.index);
route.get('/users/:id', auth, UserController.show);

export default route;