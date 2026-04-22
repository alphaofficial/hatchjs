import { run, quickAddJob } from 'graphile-worker';
import type { Runner } from 'graphile-worker';
import { PinoLogger } from '../logger/pinoLogger';
import variables from '../config/variables';

let runner: Runner | null = null;

export class Queue {
    static async start(connectionString: string, taskList: Record<string, (payload: unknown) => Promise<void>>): Promise<Runner> {
        runner = await run({
            connectionString,
            taskList,
            parsedCronItems: [],
            crontabFile: undefined,
        });
        return runner;
    }

    static async dispatch(jobName: string, payload: unknown = {}): Promise<void> {
        const connectionString = variables.DATABASE_URL;
        if (!connectionString) {
            PinoLogger.warn({ scope: 'queue', message: 'DATABASE_URL not set — job dispatch is a no-op', params: { jobName } });
            return;
        }
        await quickAddJob({ connectionString }, jobName, payload);
    }
}
