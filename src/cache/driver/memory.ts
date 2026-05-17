import type { CacheDriver } from '@/primitives/ports/cache';

interface CacheEntry {
    value: unknown;
    expiresAt: number | null;
}

export class MemoryCache implements CacheDriver {
    private store = new Map<string, CacheEntry>();

    async get<T = unknown>(key: string): Promise<T | undefined> {
        const entry = this.store.get(key);
        if (!entry) {
            return undefined;
        }

        if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return undefined;
        }

        return entry.value as T;
    }

    async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        this.store.set(key, {
            value,
            expiresAt: ttlSeconds != null ? Date.now() + ttlSeconds * 1000 : null,
        });
    }

    async delete(key: string): Promise<void> {
        this.store.delete(key);
    }

    async flush(): Promise<void> {
        this.store.clear();
    }
}
