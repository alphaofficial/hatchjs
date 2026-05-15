import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { LocalDiskDriver } from '@/adapters/outbound/storage/local';

describe('local storage adapter', () => {
    let basePath: string;
    let storage: LocalDiskDriver;

    beforeEach(async () => {
        basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'local-storage-'));
        storage = new LocalDiskDriver(basePath, 'https://app.test/');
    });

    afterEach(async () => {
        await fs.rm(basePath, { recursive: true, force: true });
    });

    it('stores and retrieves files under the configured base path', async () => {
        await storage.put('avatars/user-1.txt', 'hello');

        await expect(storage.exists('avatars/user-1.txt')).resolves.toBe(true);
        await expect(storage.get('avatars/user-1.txt')).resolves.toEqual(Buffer.from('hello'));
        await expect(fs.readFile(path.join(basePath, 'avatars/user-1.txt'))).resolves.toEqual(Buffer.from('hello'));
    });

    it('deletes files and returns stable public urls', async () => {
        await storage.put('docs/readme.txt', Buffer.from('content'));

        expect(storage.url('docs/readme.txt')).toBe('https://app.test/storage/docs/readme.txt');

        await storage.delete('docs/readme.txt');

        await expect(storage.exists('docs/readme.txt')).resolves.toBe(false);
    });

    it('rejects file paths that escape the storage directory', async () => {
        await expect(storage.put('../escape.txt', 'nope')).rejects.toThrow(
            'Invalid file path: "../escape.txt" escapes the storage directory',
        );
        await expect(storage.exists('../escape.txt')).resolves.toBe(false);
    });
});
