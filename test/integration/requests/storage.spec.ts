import { S3Driver } from '@/adapters/outbound/storage/s3';
import {
    registerStorageDriver,
    resolveStorageDriver,
} from '@/adapters/outbound/storage/configuredDriver';
import type { StorageDriver } from '@/ports/storage';

describe('configured storage driver', () => {
    let prevDriver: string | undefined;
    const store = new Map<string, Buffer>();

    const memoryDriver: StorageDriver = {
        put: async (filePath, data) => {
            store.set(filePath, Buffer.isBuffer(data) ? data : Buffer.from(data));
        },
        get: async (filePath) => {
            const value = store.get(filePath);
            if (!value) {
                throw new Error(`File not found: ${filePath}`);
            }
            return value;
        },
        delete: async (filePath) => {
            store.delete(filePath);
        },
        url: (filePath) => `/storage/${filePath}`,
        exists: async (filePath) => store.has(filePath),
    };

    beforeAll(() => {
        prevDriver = process.env.STORAGE_DRIVER;
        registerStorageDriver('test-memory', memoryDriver);
        process.env.STORAGE_DRIVER = 'test-memory';
    });

    afterAll(() => {
        if (prevDriver === undefined) delete process.env.STORAGE_DRIVER;
        else process.env.STORAGE_DRIVER = prevDriver;
    });

    beforeEach(() => {
        store.clear();
    });

    it('returns false for non-existent file', async () => {
        expect(await resolveStorageDriver().exists('missing.txt')).toBe(false);
    });

    it('puts and gets a string file', async () => {
        await resolveStorageDriver().put('hello.txt', 'world');
        const buffer = await resolveStorageDriver().get('hello.txt');
        expect(buffer.toString()).toBe('world');
    });

    it('puts and gets a Buffer file', async () => {
        const data = Buffer.from([1, 2, 3]);
        await resolveStorageDriver().put('bytes.bin', data);
        const result = await resolveStorageDriver().get('bytes.bin');
        expect(result).toEqual(data);
    });

    it('exists returns true after put', async () => {
        await resolveStorageDriver().put('exists.txt', 'yes');
        expect(await resolveStorageDriver().exists('exists.txt')).toBe(true);
    });

    it('deletes a file', async () => {
        await resolveStorageDriver().put('delete-me.txt', 'bye');
        await resolveStorageDriver().delete('delete-me.txt');
        expect(await resolveStorageDriver().exists('delete-me.txt')).toBe(false);
    });

    it('returns a public url for a file', () => {
        expect(resolveStorageDriver().url('hello.txt')).toBe('/storage/hello.txt');
    });

    it('throws when getting a missing file', async () => {
        await expect(resolveStorageDriver().get('missing.txt')).rejects.toThrow('File not found: missing.txt');
    });

    it('supports registerDriver with a custom driver', async () => {
        const data = new Map<string, Buffer>();
        const customDriver: StorageDriver = {
            put: async (filePath, value) => {
                data.set(filePath, Buffer.isBuffer(value) ? value : Buffer.from(value));
            },
            get: async (filePath) => {
                const value = data.get(filePath);
                if (!value) {
                    throw new Error(`Missing custom file: ${filePath}`);
                }
                return value;
            },
            delete: async (filePath) => {
                data.delete(filePath);
            },
            url: (filePath) => `https://cdn.example.com/${filePath}`,
            exists: async (filePath) => data.has(filePath),
        };

        registerStorageDriver('custom-storage', customDriver);

        const prev = process.env.STORAGE_DRIVER;
        try {
            process.env.STORAGE_DRIVER = 'custom-storage';
            await resolveStorageDriver().put('test.txt', 'custom');
            expect((await resolveStorageDriver().get('test.txt')).toString()).toBe('custom');
            expect(resolveStorageDriver().url('test.txt')).toBe('https://cdn.example.com/test.txt');
        } finally {
            process.env.STORAGE_DRIVER = prev;
        }
    });

    it('throws when an unregistered driver is selected', () => {
        const prev = process.env.STORAGE_DRIVER;
        try {
            process.env.STORAGE_DRIVER = 'nonexistent';
            expect(() => resolveStorageDriver()).toThrow("Storage driver 'nonexistent' is not registered");
        } finally {
            process.env.STORAGE_DRIVER = prev;
        }
    });
});

describe('configured storage driver with s3 adapter', () => {
    let prevDriver: string | undefined;

    beforeEach(() => {
        prevDriver = process.env.STORAGE_DRIVER;
    });

    afterEach(() => {
        if (prevDriver === undefined) delete process.env.STORAGE_DRIVER;
        else process.env.STORAGE_DRIVER = prevDriver;
    });

    it('can be registered and used through the configured driver', async () => {
        const s3 = new S3Driver({ bucket: 'facade-bucket', region: 'eu-west-1' });
        const mockSend = jest.fn().mockResolvedValue({});
        (s3 as any).client.send = mockSend;

        registerStorageDriver('s3-test', s3);
        process.env.STORAGE_DRIVER = 's3-test';

        await resolveStorageDriver().put('test.txt', 'hello');
        expect(mockSend).toHaveBeenCalledTimes(1);
        expect(resolveStorageDriver().url('test.txt')).toBe('https://facade-bucket.s3.eu-west-1.amazonaws.com/test.txt');
    });
});
