import type { MikroORM } from '@mikro-orm/core';
import { cleanExpiredSessions } from '@/adapters/inbound/jobs/cleanExpiredSessions';
import { Scheduler } from '@/adapters/shared/scheduler';

export function registerScheduledTasks(orm: MikroORM): void {
	Scheduler.schedule('0 * * * *', () => cleanExpiredSessions(orm));
}
