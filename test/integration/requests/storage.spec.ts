import { storage, registerDriver, StorageDriver } from '@/lib/storage';

describe('storage (memory driver)', () => {
    let prevDriver: string | undefined;

    beforeAll(() => {
        prevDriver = process.env.STORAGE_DRIVER;
        process.env.STORAGE_DRIVER = 'memory';
    });

    afterAll(() => {
        if (prevDriver === undefined) delete process.env.STORAGE_DRIVER;
        else process.env.STORAGE_DRIVER = prevDriver;
    });

    it('returns false for non-existent file', async () => {
        expect(await storage.exists('missing.txt')).toBe(false);
    });

    it('puts and gets a string file', async () => {
        await storage.put('hello.txt', 'world');
        const buf = await storage.get('hello.txt');
        expect(buf.toString()).toBe('world');
    });

    it('puts and gets a Buffer file', async () => {
        const data = Buffer.from([1, 2, 3]);
        await storage.put('bytes.bin', data);
        const result = await storage.get('bytes.bin');
        expect(result).toEqual(data);
    });

    it('exists returns true after put', async () => {
        await storage.put('exists.txt', 'yes');
        expect(await storage.exists('exists.txt')).toBe(true);
    });

    it('deletes a file', async () => {
        await storage.put('delete-me.txt', 'bye');
        await storage.delete('delete-me.txt');
        expect(await storage.exists('delete-me.txt')).toBe(false);
    });

    it('get throws for missing file', async () => {
        await expect(storage.get('no-such-file.txt')).rejects.toThrow('File not found');
    });

    it('url returns a URL for the file', () => {
        const u = storage.url('avatar.png');
        expect(u).toContain('avatar.png');
    });

    it('supports registerDriver with a custom driver', async () => {
        const data = new Map<string, Buffer>();
        const customDriver: StorageDriver = {
            put: async (p, d) => { data.set(p, Buffer.isBuffer(d) ? d : Buffer.from(d)); },
            get: async (p) => {
                const v = data.get(p);
                if (!v) throw new Error(`File not found: ${p}`);
                return v;
            },
            delete: async (p) => { data.delete(p); },
            url: (p) => `https://cdn.example.com/${p}`,
            exists: async (p) => data.has(p),
        };
        registerDriver('custom-storage', customDriver);
        const prev = process.env.STORAGE_DRIVER;
        try {
            process.env.STORAGE_DRIVER = 'custom-storage';
            await storage.put('test.txt', 'custom');
            expect((await storage.get('test.txt')).toString()).toBe('custom');
            expect(storage.url('test.txt')).toBe('https://cdn.example.com/test.txt');
        } finally {
            process.env.STORAGE_DRIVER = prev;
        }
    });

    it('throws when an unregistered driver is selected', async () => {
        const prev = process.env.STORAGE_DRIVER;
        try {
            process.env.STORAGE_DRIVER = 'nonexistent';
            expect(() => storage.exists('any')).toThrow("Storage driver 'nonexistent' is not registered");
        } finally {
            process.env.STORAGE_DRIVER = prev;
        }
    });
});
