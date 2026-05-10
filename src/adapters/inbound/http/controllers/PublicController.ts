import { Request, Response } from 'express';
import { BaseController } from './BaseController';

export class PublicController extends BaseController {
	static async index(req: Request, res: Response) {
		return new PublicController(req, res).render('Home', {
			timestamp: new Date().toISOString(),
		});
	}
}
