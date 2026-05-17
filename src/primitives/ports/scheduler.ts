export interface ScheduledHandle {
    start(): void;
    stop(): void;
}

export interface SchedulerEngine {
    validate(expression: string): boolean;
    schedule(expression: string, handler: () => void | Promise<void>): ScheduledHandle;
}

export type SchedulerDriver = SchedulerEngine;

export interface ScheduledTask {
    expression: string;
    handler: () => void | Promise<void>;
    task: ScheduledHandle;
}
