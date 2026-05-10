import { Request, Response } from 'express';
import { BaseController } from './BaseController';

interface User {
	id: number;
	name: string;
	email: string;
}

export class UserController {
	private userDirectory: User[] = [
		{ id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
		{ id: 2, name: 'Bob Smith', email: 'bob@example.com' },
		{ id: 3, name: 'Charlie Brown', email: 'charlie@example.com' }
	];

	index = async (req: Request, res: Response) => {
		return new BaseController(req, res).render('Users', { users: this.userDirectory });
	};

	show = async (req: Request, res: Response) => {
		const user = this.userDirectory.find((u: User) => u.id === parseInt(req.params.id));

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		return new BaseController(req, res).render('User', { user });
	};
}
