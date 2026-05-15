import type { StorageDriver } from '@/ports/storage';

describe('storage port', () => {
    it('supports the expected StorageDriver contract', async () => {
        const calls: unknown[][] = [];
        const stored = new Map<string, Buffer>();
        const driver: StorageDriver = {
            put: async (filePath, data) => {
                calls.push(['put', filePath, data]);
                stored.set(filePath, Buffer.isBuffer(data) ? data : Buffer.from(data));
            },
            get: async (filePath) => {
                calls.push(['get', filePath]);
                const file = stored.get(filePath);
                if (!file) throw new Error(`Missing file: ${filePath}`);
                return file;
            },
            delete: async (filePath) => {
                calls.push(['delete', filePath]);
                stored.delete(filePath);
            },
            url: (filePath) => {
                calls.push(['url', filePath]);
                return `https://cdn.example.com/${filePath}`;
            },
            exists: async (filePath) => {
                calls.push(['exists', filePath]);
                return stored.has(filePath);
            },
        };

        await driver.put('avatars/user-1.png', 'image-data');
        const file = await driver.get('avatars/user-1.png');
        const existsBeforeDelete = await driver.exists('avatars/user-1.png');
        const url = driver.url('avatars/user-1.png');
        await driver.delete('avatars/user-1.png');
        const existsAfterDelete = await driver.exists('avatars/user-1.png');

        expect(file.toString()).toBe('image-data');
        expect(existsBeforeDelete).toBe(true);
        expect(url).toBe('https://cdn.example.com/avatars/user-1.png');
        expect(existsAfterDelete).toBe(false);
        expect(calls).toEqual([
            ['put', 'avatars/user-1.png', 'image-data'],
            ['get', 'avatars/user-1.png'],
            ['exists', 'avatars/user-1.png'],
            ['url', 'avatars/user-1.png'],
            ['delete', 'avatars/user-1.png'],
            ['exists', 'avatars/user-1.png'],
        ]);
    });
});
