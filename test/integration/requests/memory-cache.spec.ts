import { MemoryCache } from '@/adapters/outbound/cache/memory';

describe('memory cache adapter', () => {
    it('stores and retrieves values', async () => {
        const cache = new MemoryCache();

        await cache.set('user:1', { id: 1 });

        expect(await cache.get('user:1')).toEqual({ id: 1 });
    });

    it('deletes values and flushes the store', async () => {
        const cache = new MemoryCache();

        await cache.set('first', 1);
        await cache.set('second', 2);
        await cache.delete('first');

        expect(await cache.get('first')).toBeUndefined();

        await cache.flush();

        expect(await cache.get('second')).toBeUndefined();
    });

    it('expires values after the configured ttl', async () => {
        const cache = new MemoryCache();

        await cache.set('ttl', 'value', 0.05);
        expect(await cache.get('ttl')).toBe('value');

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(await cache.get('ttl')).toBeUndefined();
    });
});
