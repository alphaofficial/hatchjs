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
		const instance = new UserController();
		return await instance.render(req, res, 'Users', { users: instance.userDirectory });
	}

	static async show(req: Request, res: Response) {
		const id = req.params.id as string;
		const instance = new UserController();
		const user = instance.userDirectory.find((u: User) => u.id === parseInt(id));
		
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		return await instance.render(req, res, 'User', { user });
	}
}