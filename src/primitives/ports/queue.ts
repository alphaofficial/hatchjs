export interface Runner {
    stop(): Promise<void>;
}

export type TaskList = Record<string, (...args: any[]) => void | Promise<void>>;

export interface QueueDriver {
    dispatch(jobName: string, payload: unknown): Promise<void>;
    start?(connectionString: string, taskList: TaskList): Promise<Runner>;
}
