import 'dotenv-defaults/config';
import { MikroORM } from '@mikro-orm/core';
import ormConfig from './database/orm.config';
import { schedule, getRegisteredTasks } from './lib/scheduler';
import { Session } from './models/Session';
import { PinoLogger } from './logger/pinoLogger';

async function cleanExpiredSessions(orm: MikroORM): Promise<void> {
    const maxAgeSeconds = 24 * 60 * 60;
    const cutoff = Math.floor(Date.now() / 1000) - maxAgeSeconds;
    const em = orm.em.fork();
    const deleted = await em.nativeDelete(Session, { last_activity: { $lte: cutoff } });
    if (deleted > 0) {
        PinoLogger.info('scheduler', `Cleaned ${deleted} expired session(s)`);
    }
}

async function main() {
    const orm = await MikroORM.init(ormConfig);

    // Clean expired sessions every hour
    schedule('0 * * * *', () => cleanExpiredSessions(orm));

    const registered = getRegisteredTasks();
    PinoLogger.info('scheduler', `Scheduler started with ${registered.length} task(s)`, {
        tasks: registered.map(t => t.expression),
    });

    const shutdown = async () => {
        PinoLogger.info('scheduler', 'Shutting down scheduler...');
        await orm.close(true);
        process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

main().catch(err => {
    PinoLogger.error('scheduler', 'Scheduler failed to start', { error: err });
    process.exit(1);
});
