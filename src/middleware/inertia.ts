import { Request, Response, NextFunction } from 'express';
import { InertiaExpressAdapter } from '../adapters/InertiaExpressAdapter';

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
	static apply(req: Request, res: Response, next: NextFunction) {
		const inertia = new InertiaExpressAdapter({
			version: '1',
		});

		inertia.share({
			applicationName: 'Express Inertia App',
		});

		req.inertia = inertia;

		// Add render method to response (just calls the adapter)
		res.inertia = (component: string, props: Record<string, any> = {}) => {
			return inertia.render(req, res, component, props);
		};

		next();
	}
}