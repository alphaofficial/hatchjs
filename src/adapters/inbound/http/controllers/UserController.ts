import { Request, Response } from 'express';
import { BaseController } from './BaseController';

interface User {
	id: number;
	name: string;
	email: string;
}

export class UserController extends BaseController {
	private userDirectory: User[] = [
		{ id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
		{ id: 2, name: 'Bob Smith', email: 'bob@example.com' },
		{ id: 3, name: 'Charlie Brown', email: 'charlie@example.com' }
	];

	static async index(req: Request, res: Response) {
		const controller = new UserController(req, res);
		return controller.render('Users', { users: controller.userDirectory });
	}

	static async show(req: Request, res: Response) {
		const controller = new UserController(req, res);
		const user = controller.userDirectory.find((u: User) => u.id === parseInt(req.params.id));

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		return controller.render('User', { user });
	}
}
