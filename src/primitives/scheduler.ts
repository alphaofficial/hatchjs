import { PinoLogger } from '../logger/pinoLogger';
import type { ScheduledHandle, ScheduledTask, SchedulerDriver, SchedulerEngine } from './ports/scheduler';

export type { ScheduledHandle, ScheduledTask, SchedulerDriver, SchedulerEngine } from './ports/scheduler';

let registeredDriver: SchedulerDriver | null = null;
let activeDriver: SchedulerDriver | null = null;
const tasks: ScheduledTask[] = [];

export class Scheduler {
    static setDriver(driver: SchedulerDriver): void {
        registeredDriver = driver;
        activeDriver = driver;
    }

    static useDriver(driver: SchedulerDriver): void {
        activeDriver = driver;
    }

    static useEngine(engine: SchedulerEngine): void {
        this.useDriver(engine);
    }

    static reset(): void {
        activeDriver = registeredDriver;
        tasks.splice(0, tasks.length);
    }

    static schedule(expression: string, handler: () => void | Promise<void>): ScheduledHandle {
        const engine = this.getActiveEngine();
        if (!engine.validate(expression)) {
            throw new Error(`Invalid cron expression: "${expression}"`);
        }

        const wrappedHandler = async () => {
            try {
                await handler();
            } catch (err) {
                PinoLogger.error({ scope: 'scheduler', message: `Task failed (${expression})`, params: { error: err } });
            }
        };

        const task = engine.schedule(expression, wrappedHandler);
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

    private static getActiveDriver(): SchedulerDriver {
        if (!activeDriver) {
            throw new Error('Scheduler driver is not registered');
        }
        return activeDriver;
    }

    private static getActiveEngine(): SchedulerEngine {
        return this.getActiveDriver();
    }
}
