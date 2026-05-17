import type { QueueDriver, Runner, TaskList } from '@/primitives/ports/queue';

export type { QueueDriver, Runner, TaskList } from '@/primitives/ports/queue';

let activeDriver: QueueDriver | null = null;

export class Queue {
    static setDriver(driver: QueueDriver): void {
        activeDriver = driver;
    }

    static reset(): void {
        activeDriver = null;
    }

    static async start(connectionString: string, taskList: TaskList): Promise<Runner> {
        const driver = this.getActiveDriver();
        if (!driver.start) {
            throw new Error('Queue driver does not support starting workers');
        }
        return driver.start(connectionString, taskList);
    }

    static async dispatch(jobName: string, payload: unknown = {}): Promise<void> {
        await this.getActiveDriver().dispatch(jobName, payload);
    }

    private static getActiveDriver(): QueueDriver {
        if (!activeDriver) {
            throw new Error('Queue driver is not registered');
        }
        return activeDriver;
    }
}
