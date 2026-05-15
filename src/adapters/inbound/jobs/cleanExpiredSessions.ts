import type { MikroORM } from '@mikro-orm/core';
import { PinoLogger } from '@/adapters/shared/logger/pinoLogger';
import variables from '@/config/variables';
import { Session } from '@/core/models/Session';

export async function cleanExpiredSessions(orm: MikroORM): Promise<void> {
	const maxAgeSeconds = Math.floor(variables.SESSION_MAX_AGE / 1000);
	const cutoff = Math.floor(Date.now() / 1000) - maxAgeSeconds;
	const em = orm.em.fork();
	const deleted = await em.nativeDelete(Session, { last_activity: { $lte: cutoff } });
	if (deleted > 0) {
		PinoLogger.info({ scope: 'scheduler', message: `Cleaned ${deleted} expired session(s)` });
	}
}
