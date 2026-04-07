import { Request, Response } from 'express';
import { BaseController } from './BaseController';

export class PublicController extends BaseController {
	static async index(req: Request, res: Response) {
		// applicationName is shared globally via InertiaExpressMiddleware,
		// so we don't override it here.
		return new PublicController().render(req, res, 'Home', {
			timestamp: new Date().toISOString(),
		});
	}
}