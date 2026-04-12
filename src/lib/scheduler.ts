import * as cron from 'node-cron';
import type { ScheduledTask as CronTask } from 'node-cron';

export interface ScheduledTask {
    expression: string;
    handler: () => void | Promise<void>;
    task: CronTask;
}

const tasks: ScheduledTask[] = [];

export function schedule(expression: string, handler: () => void | Promise<void>): CronTask {
    if (!cron.validate(expression)) {
        throw new Error(`Invalid cron expression: "${expression}"`);
    }

    const task = cron.schedule(expression, async () => {
        try {
            await handler();
        } catch (err) {
            console.error(`[scheduler] Task failed (${expression}):`, err);
        }
    });

    tasks.push({ expression, handler, task });
    return task;
}

export function startAll(): void {
    tasks.forEach(t => t.task.start());
}

export function stopAll(): void {
    tasks.forEach(t => t.task.stop());
}

export function getRegisteredTasks(): ReadonlyArray<{ expression: string }> {
    return tasks.map(t => ({ expression: t.expression }));
}
