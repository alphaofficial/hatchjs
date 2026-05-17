import type { MikroORM } from '@mikro-orm/core';
import type { PinoLogger } from '@/logger/pinoLogger';
import type { User } from '@/models/User';

declare module 'express-serve-static-core' {
	interface Request {
		orm: MikroORM;
		entityManager: MikroORM['em'];
		logger: typeof PinoLogger;
		user(): Promise<User | null>;
		user_id(): User['id'] | null;
		is_authenticated(): boolean;
		is_guest(): boolean;
		authenticate(user: User): Promise<void>;
		logout(): Promise<void>;
	}
}
