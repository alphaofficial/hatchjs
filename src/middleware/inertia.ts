import { Request, Response, NextFunction } from 'express';
import { InertiaExpressAdapter } from '../adapters/InertiaExpressAdapter';
import variables from '../config/variables';

// Extend Express Request to include inertia
declare module 'express-serve-static-core' {
  interface Request {
    inertia: InertiaExpressAdapter;
  }
  interface Response {
    inertia(component: string, props?: Record<string, any>): void;
  }
}

export class InertiaExpressMiddleware {
	static async apply(req: Request, res: Response, next: NextFunction) {
		const inertia = new InertiaExpressAdapter({
			version: '1',
		});

		// Get current user for global sharing
		const user = await req.user();
		const isAuthenticated = req.is_authenticated();

		inertia.share({
			applicationName: variables.APP_NAME,
			isAuthenticated,
			user: user ? {
				id: user.id,
				name: user.name,
				email: user.email
			} : null,
		});

		req.inertia = inertia;

		res.inertia = (component: string, props: Record<string, any> = {}) => {
			return inertia.render(req, res, component, props);
		};

		next();
	}
}