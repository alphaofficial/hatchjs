import type { CacheDriver } from '@/ports/cache';
import { MemoryCache } from '@/adapters/outbound/cache/memory';

const drivers = new Map<string, CacheDriver>();
drivers.set('memory', new MemoryCache());

function getDriver(): CacheDriver {
    const name = process.env.CACHE_DRIVER ?? 'memory';
    const driver = drivers.get(name);
    if (!driver) {
        throw new Error(`Cache driver '${name}' is not registered`);
    }
    return driver;
}

export class Cache {
    static registerDriver(name: string, driver: CacheDriver): void {
        drivers.set(name, driver);
    }

    static get<T = unknown>(key: string): Promise<T | undefined> {
        return getDriver().get<T>(key);
    }

    static set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        return getDriver().set(key, value, ttlSeconds);
    }

    static delete(key: string): Promise<void> {
        return getDriver().delete(key);
    }

    static flush(): Promise<void> {
        return getDriver().flush();
    }
}
