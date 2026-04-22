import * as cron from 'node-cron';
import type { ScheduledTask as CronTask } from 'node-cron';
import { PinoLogger } from '../logger/pinoLogger';

export interface ScheduledTask {
    expression: string;
    handler: () => void | Promise<void>;
    task: CronTask;
}

const tasks: ScheduledTask[] = [];

export class Scheduler {
    static schedule(expression: string, handler: () => void | Promise<void>): CronTask {
        if (!cron.validate(expression)) {
            throw new Error(`Invalid cron expression: "${expression}"`);
        }

        const task = cron.schedule(expression, async () => {
            try {
                await handler();
            } catch (err) {
                PinoLogger.error({ scope: 'scheduler', message: `Task failed (${expression})`, params: { error: err } });
            }
        });

        tasks.push({ expression, handler, task });
        return task;
    }

    static startAll(): void {
        tasks.forEach(t => t.task.start());
    }

    static stopAll(): void {
        tasks.forEach(t => t.task.stop());
    }

    static getRegisteredTasks(): ReadonlyArray<{ expression: string }> {
        return tasks.map(t => ({ expression: t.expression }));
    }
}
