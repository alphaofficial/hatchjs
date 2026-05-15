import {
    registerCacheDriver,
    resolveCacheDriver,
} from '@/adapters/outbound/cache/configuredDriver';
import type { CacheDriver } from '@/ports/cache';

describe('configured cache driver', () => {
    beforeEach(async () => {
        await resolveCacheDriver().flush();
    });

    it('returns undefined for missing key', async () => {
        const value = await resolveCacheDriver().get('missing');
        expect(value).toBeUndefined();
    });

    it('stores and retrieves a value', async () => {
        await resolveCacheDriver().set('foo', 'bar');
        expect(await resolveCacheDriver().get('foo')).toBe('bar');
    });

    it('stores and retrieves an object', async () => {
        await resolveCacheDriver().set('obj', { a: 1 });
        expect(await resolveCacheDriver().get('obj')).toEqual({ a: 1 });
    });

    it('deletes a key', async () => {
        await resolveCacheDriver().set('key', 'value');
        await resolveCacheDriver().delete('key');
        expect(await resolveCacheDriver().get('key')).toBeUndefined();
    });

    it('flush clears all keys', async () => {
        await resolveCacheDriver().set('a', 1);
        await resolveCacheDriver().set('b', 2);
        await resolveCacheDriver().flush();
        expect(await resolveCacheDriver().get('a')).toBeUndefined();
        expect(await resolveCacheDriver().get('b')).toBeUndefined();
    });

    it('expires a key after TTL', async () => {
        await resolveCacheDriver().set('ttl', 'expires', 0.05);
        expect(await resolveCacheDriver().get('ttl')).toBe('expires');
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(await resolveCacheDriver().get('ttl')).toBeUndefined();
    });

    it('does not expire a key without TTL', async () => {
        await resolveCacheDriver().set('forever', 'value');
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(await resolveCacheDriver().get('forever')).toBe('value');
    });

    it('supports registerDriver with a custom driver', async () => {
        const data = new Map<string, unknown>();
        const customDriver: CacheDriver = {
            get: async (key) => data.get(key) as any,
            set: async (key, value) => { data.set(key, value); },
            delete: async (key) => { data.delete(key); },
            flush: async () => { data.clear(); },
        };

        registerCacheDriver('custom', customDriver);

        const prev = process.env.CACHE_DRIVER;
        try {
            process.env.CACHE_DRIVER = 'custom';
            await resolveCacheDriver().set('x', 42);
            expect(await resolveCacheDriver().get('x')).toBe(42);
        } finally {
            if (prev === undefined) delete process.env.CACHE_DRIVER;
            else process.env.CACHE_DRIVER = prev;
        }
    });

    it('throws when an unregistered driver is selected', () => {
        const prev = process.env.CACHE_DRIVER;
        try {
            process.env.CACHE_DRIVER = 'nonexistent';
            expect(() => resolveCacheDriver()).toThrow("Cache driver 'nonexistent' is not registered");
        } finally {
            if (prev === undefined) delete process.env.CACHE_DRIVER;
            else process.env.CACHE_DRIVER = prev;
        }
    });
});
