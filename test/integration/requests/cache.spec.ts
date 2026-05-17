import { MemoryCache } from '@/cache/drivers/memory';
import { Cache, CacheDriver } from '@/primitives/cache';

describe('cache (in-memory driver)', () => {
    beforeEach(async () => {
        Cache.setDriver(new MemoryCache());
        await Cache.flush();
    });

    it('returns undefined for missing key', async () => {
        const val = await Cache.get('missing');
        expect(val).toBeUndefined();
    });

    it('stores and retrieves a value', async () => {
        await Cache.set('foo', 'bar');
        expect(await Cache.get('foo')).toBe('bar');
    });

    it('stores and retrieves an object', async () => {
        await Cache.set('obj', { a: 1 });
        expect(await Cache.get('obj')).toEqual({ a: 1 });
    });

    it('deletes a key', async () => {
        await Cache.set('key', 'value');
        await Cache.delete('key');
        expect(await Cache.get('key')).toBeUndefined();
    });

    it('flush clears all keys', async () => {
        await Cache.set('a', 1);
        await Cache.set('b', 2);
        await Cache.flush();
        expect(await Cache.get('a')).toBeUndefined();
        expect(await Cache.get('b')).toBeUndefined();
    });

    it('expires a key after TTL', async () => {
        await Cache.set('ttl', 'expires', 0.05); // 50ms TTL
        expect(await Cache.get('ttl')).toBe('expires');
        await new Promise(r => setTimeout(r, 100));
        expect(await Cache.get('ttl')).toBeUndefined();
    });

    it('does not expire a key without TTL', async () => {
        await Cache.set('forever', 'value');
        await new Promise(r => setTimeout(r, 50));
        expect(await Cache.get('forever')).toBe('value');
    });

    it('supports a custom driver', async () => {
        const data = new Map<string, unknown>();
        const customDriver: CacheDriver = {
            get: async (key) => data.get(key) as any,
            set: async (key, value) => { data.set(key, value); },
            delete: async (key) => { data.delete(key); },
            flush: async () => { data.clear(); },
        };
        Cache.setDriver(customDriver);
        await Cache.set('x', 42);
        expect(await Cache.get('x')).toBe(42);
    });

    it('throws when no driver is registered', () => {
        Cache.reset();
        expect(() => Cache.get('any')).toThrow('Cache driver is not registered');
    });
});
