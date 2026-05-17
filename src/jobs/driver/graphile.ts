import { run, quickAddJob } from 'graphile-worker';
import type { Runner as GraphileRunner, TaskList as GraphileTaskList } from 'graphile-worker';
import variables from '@/config/variables';
import { PinoLogger } from '@/logger/pinoLogger';
import type { QueueDriver, Runner, TaskList } from '@/primitives/ports/queue';

export class GraphileQueueDriver implements QueueDriver {
    async start(connectionString: string, taskList: TaskList): Promise<Runner> {
        const runner: GraphileRunner = await run({
            connectionString,
            taskList: taskList as GraphileTaskList,
            parsedCronItems: [],
            crontabFile: undefined,
        });
        return runner;
    }

    async dispatch(jobName: string, payload: unknown): Promise<void> {
        const connectionString = variables.DATABASE_URL;
        if (!connectionString) {
            PinoLogger.warn({ scope: 'queue', message: 'DATABASE_URL not set — job dispatch is a no-op', params: { jobName } });
            return;
        }
        await quickAddJob({ connectionString }, jobName, payload);
    }
}
