import * as cron from 'node-cron';
import type { ScheduledTask as CronTask } from 'node-cron';
import type { SchedulerDriver } from '@/primitives/ports/scheduler';

export class NodeCronSchedulerDriver implements SchedulerDriver {
    validate(expression: string): boolean {
        return cron.validate(expression);
    }

    schedule(expression: string, handler: () => void | Promise<void>): CronTask {
        return cron.schedule(expression, handler);
    }
}
