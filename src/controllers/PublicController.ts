import { Request, Response } from 'express';
import { BaseController } from './BaseController';

export class PublicController extends BaseController {
	static async index(req: Request, res: Response) {
		let weather = null;
		try {
			const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true');
			weather = await response.json();
		} catch (error) {
			console.error('Weather API failed:', error);
		}

		const data = {
			message: 'Welcome to Express with Inertia.js!',
			timestamp: new Date().toISOString(),
			weather,
		};

		const instance = new PublicController();
		return await instance.render(req, res, 'Home', data);
	}
}