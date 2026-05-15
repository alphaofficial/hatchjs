import type { CacheDriver } from '@/ports/cache';

describe('cache port', () => {
    it('supports the expected CacheDriver contract', async () => {
        const calls: unknown[][] = [];
        const driver: CacheDriver = {
            get: async <T>(key: string) => {
                calls.push(['get', key]);
                return undefined as T | undefined;
            },
            set: async (key, value, ttlSeconds) => {
                calls.push(['set', key, value, ttlSeconds]);
            },
            delete: async (key) => {
                calls.push(['delete', key]);
            },
            flush: async () => {
                calls.push(['flush']);
            },
        };

        const value = await driver.get<{ ok: boolean }>('user:1');
        await driver.set('user:1', { ok: true }, 60);
        await driver.delete('user:1');
        await driver.flush();

        expect(value).toBeUndefined();
        expect(calls).toEqual([
            ['get', 'user:1'],
            ['set', 'user:1', { ok: true }, 60],
            ['delete', 'user:1'],
            ['flush'],
        ]);
    });
});
