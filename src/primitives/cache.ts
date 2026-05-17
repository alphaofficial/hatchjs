import type { CacheDriver } from '@/primitives/ports/cache';

export type { CacheDriver } from '@/primitives/ports/cache';

let activeDriver: CacheDriver | null = null;

export class Cache {
    static setDriver(driver: CacheDriver): void {
        activeDriver = driver;
    }

    static reset(): void {
        activeDriver = null;
    }

    static get<T = unknown>(key: string): Promise<T | undefined> {
        return this.getActiveDriver().get<T>(key);
    }

    static set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        return this.getActiveDriver().set(key, value, ttlSeconds);
    }

    static delete(key: string): Promise<void> {
        return this.getActiveDriver().delete(key);
    }

    static flush(): Promise<void> {
        return this.getActiveDriver().flush();
    }

    private static getActiveDriver(): CacheDriver {
        if (!activeDriver) {
            throw new Error('Cache driver is not registered');
        }
        return activeDriver;
    }
}
