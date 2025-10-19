import { Request, Response } from 'express';
import { BaseController } from './BaseController';

export class AboutController extends BaseController {
	static async index(req: Request, res: Response) {
		const instance = new AboutController();
		return await instance.render(req, res, 'About', {
			title: 'About Us',
			description: 'This is an Inertia.js app running on Express with React.',
		});
	}
}