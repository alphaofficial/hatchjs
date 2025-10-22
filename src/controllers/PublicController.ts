import { Request, Response } from 'express';
import { BaseController } from './BaseController';

export class PublicController extends BaseController {
	static async index(req: Request, res: Response) {
		// If user is authenticated, redirect to dashboard
		if (req.is_authenticated()) {
			return res.redirect('/dashboard');
		}

		// If user is not authenticated, redirect to login
		return res.redirect('/login');
	}
}