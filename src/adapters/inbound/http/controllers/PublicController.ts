import { Request, Response } from 'express';
import { BaseController } from './BaseController';

export class PublicController {
	index = async (req: Request, res: Response) => {
		return new BaseController(req, res).render('Home', {
			timestamp: new Date().toISOString(),
		});
	};
}
