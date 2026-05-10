import { Request, Response } from 'express';
import { BaseController } from './BaseController';

export class AboutController extends BaseController {
	static async index(req: Request, res: Response) {
		return new AboutController(req, res).render('About', {
			title: 'About Us',
			description: 'This is an Inertia.js app running on Express with React.',
		});
	}
}
