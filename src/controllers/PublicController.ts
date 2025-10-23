import { Request, Response } from 'express';
import { BaseController } from './BaseController';

export class PublicController extends BaseController {
	static async index(req: Request, res: Response) {
		return new PublicController().render(req, res, 'Home', {
			applicationName: 'Express Inertia',
			message: 'Welcome to Express Inertia - Modern web development made simple',
			timestamp: new Date().toISOString()
		});
	}
}