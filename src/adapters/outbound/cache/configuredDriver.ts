import type { CacheDriver } from '@/ports/cache';
import { MemoryCache } from './memory';

const drivers = new Map<string, CacheDriver>([
    ['memory', new MemoryCache()],
]);

export function registerCacheDriver(name: string, driver: CacheDriver): void {
    drivers.set(name, driver);
}

export function resolveCacheDriver(): CacheDriver {
    const driverName = process.env.CACHE_DRIVER ?? 'memory';
    const driver = drivers.get(driverName);
    if (!driver) {
        throw new Error(`Cache driver '${driverName}' is not registered`);
    }
    return driver;
}
