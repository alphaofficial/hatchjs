import 'dotenv-defaults/config';
import { MikroORM } from '@mikro-orm/core';
import ormConfig from './database/orm.config';
import { Scheduler } from './lib/scheduler';
import { Session } from './models/Session';
import { PinoLogger } from './logger/pinoLogger';
import variables from './config/variables';

async function cleanExpiredSessions(orm: MikroORM): Promise<void> {
    const maxAgeSeconds = Math.floor(variables.SESSION_MAX_AGE / 1000);
    const cutoff = Math.floor(Date.now() / 1000) - maxAgeSeconds;
    const em = orm.em.fork();
    const deleted = await em.nativeDelete(Session, { last_activity: { $lte: cutoff } });
    if (deleted > 0) {
        PinoLogger.info({ scope: 'scheduler', message: `Cleaned ${deleted} expired session(s)` });
    }
}

async function main() {
    const orm = await MikroORM.init(ormConfig);

    // Clean expired sessions every hour
    Scheduler.schedule('0 * * * *', () => cleanExpiredSessions(orm));

    const registered = Scheduler.getRegisteredTasks();
    PinoLogger.info({
        scope: 'scheduler',
        message: `Scheduler started with ${registered.length} task(s)`,
        params: { tasks: registered.map(t => t.expression) },
    });

    const shutdown = async () => {
        PinoLogger.info({ scope: 'scheduler', message: 'Shutting down scheduler...' });
        await orm.close(true);
        process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

main().catch(err => {
    PinoLogger.error({ scope: 'scheduler', message: 'Scheduler failed to start', params: { error: err } });
    process.exit(1);
});
