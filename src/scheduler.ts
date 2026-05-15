import 'dotenv-defaults/config';
import { MikroORM } from '@mikro-orm/core';
import { registerScheduledTasks } from '@/adapters/inbound/jobs/scheduledTasks';
import ormConfig from '@/adapters/outbound/persistence/orm.config';
import { Scheduler } from '@/adapters/shared/scheduler';
import { PinoLogger } from '@/adapters/shared/logger/pinoLogger';

function registerShutdown(orm: MikroORM): void {
    const shutdown = async () => {
        PinoLogger.info({ scope: 'scheduler', message: 'Shutting down scheduler...' });
        await orm.close(true);
        process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

export async function startScheduler(): Promise<MikroORM> {
    const orm = await MikroORM.init(ormConfig);

    registerScheduledTasks(orm);

    const registered = Scheduler.getRegisteredTasks();
    PinoLogger.info({
        scope: 'scheduler',
        message: `Scheduler started with ${registered.length} task(s)`,
        params: { tasks: registered.map(t => t.expression) },
    });

    registerShutdown(orm);

    return orm;
}

if (require.main === module) {
    startScheduler().catch(err => {
        PinoLogger.error({ scope: 'scheduler', message: 'Scheduler failed to start', params: { error: err } });
        process.exit(1);
    });
}
