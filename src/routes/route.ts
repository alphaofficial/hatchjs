import { Router } from 'express';
import { PublicController } from '../controllers/PublicController';
import { AboutController } from '../controllers/AboutController';
import { UserController } from '../controllers/UserController';
import { InertiaMiddleware } from '../middleware/inertia';

const route = Router();

// Apply Inertia middleware to all routes
route.use(InertiaMiddleware.run);

// Define routes
route.get('/', PublicController.index);
route.get('/about', AboutController.index);
route.get('/users', UserController.index);
route.get('/users/:id', UserController.show);

export default route;