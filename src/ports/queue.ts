export interface QueueDriver {
    dispatch(jobName: string, payload?: unknown): Promise<void>;
}
