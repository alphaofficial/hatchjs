import { type Request, type Response, type NextFunction } from 'express';
import { InertiaExpressAdapter } from '../adapters/InertiaExpressAdapter';
import { renderInertiaHtml } from '../views/renderInertiaHtml';
import variables from '../config/variables';

declare module 'express-serve-static-core' {
	interface Request {
		inertia: InertiaExpressAdapter;
	}
}

export class InertiaExpressMiddleware {
	static async apply(req: Request, res: Response, next: NextFunction) {
		const inertia = new InertiaExpressAdapter({ version: '1' });

		const user = await req.user();
		const isAuthenticated = req.is_authenticated();

		inertia.share({
			applicationName: variables.APP_NAME,
			isAuthenticated,
			user: user ? { id: user.id, name: user.name, email: user.email } : null,
		});

		req.inertia = inertia;

		// Override res.render so controllers can call res.render('Page', props)
		res.render = ((view: string, props: Record<string, any> = {}) => {
			const page = inertia.render(req, res, view, props);

			if (res.headersSent) return;

			renderInertiaHtml(page, props._title, props._head)
				.then(html => res.send(html))
				.catch(next);
		}) as any;

		next();
	}
}
