import { Request, Response } from 'express';
import { BaseController } from './BaseController';

export class AboutController {
	index = async (req: Request, res: Response) => {
		return new BaseController(req, res).render('About', {
			title: 'About Us',
			description: 'This is an Inertia.js app running on Express with React.',
		});
	};
}
