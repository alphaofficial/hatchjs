export interface CacheDriver {
    get<T = unknown>(key: string): Promise<T | undefined>;
    set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
    delete(key: string): Promise<void>;
    flush(): Promise<void>;
}
