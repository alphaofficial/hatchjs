import { Storage } from '@/primitives/storage';
import type { StorageDriver } from '@/primitives/ports/storage';
import { LocalDiskDriver } from '@/storage/drivers/localDisk';
import { S3Driver } from '@/storage/drivers/s3';
import { S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { sdkStreamMixin } from '@smithy/util-stream';

describe('storage (in-memory test driver)', () => {
    const store = new Map<string, Buffer>();

    const memoryDriver: StorageDriver = {
        put: async (p, d) => { store.set(p, Buffer.isBuffer(d) ? d : Buffer.from(d)); },
        get: async (p) => {
            const v = store.get(p);
            if (!v) throw new Error(`File not found: ${p}`);
            return v;
        },
        delete: async (p) => { store.delete(p); },
        url: (p) => `/storage/${p}`,
        exists: async (p) => store.has(p),
    };

    beforeAll(() => {
        Storage.setDriver(memoryDriver);
    });

    beforeEach(() => {
        store.clear();
        Storage.setDriver(memoryDriver);
    });

    it('returns false for non-existent file', async () => {
        expect(await Storage.exists('missing.txt')).toBe(false);
    });

    it('puts and gets a string file', async () => {
        await Storage.put('hello.txt', 'world');
        const buf = await Storage.get('hello.txt');
        expect(buf.toString()).toBe('world');
    });

    it('puts and gets a Buffer file', async () => {
        const data = Buffer.from([1, 2, 3]);
        await Storage.put('bytes.bin', data);
        const result = await Storage.get('bytes.bin');
        expect(result).toEqual(data);
    });

    it('exists returns true after put', async () => {
        await Storage.put('exists.txt', 'yes');
        expect(await Storage.exists('exists.txt')).toBe(true);
    });

    it('deletes a file', async () => {
        await Storage.put('delete-me.txt', 'bye');
        await Storage.delete('delete-me.txt');
        expect(await Storage.exists('delete-me.txt')).toBe(false);
    });

    it('get throws for missing file', async () => {
        await expect(Storage.get('no-such-file.txt')).rejects.toThrow('File not found');
    });

    it('url returns a URL for the file', () => {
        const u = Storage.url('avatar.png');
        expect(u).toContain('avatar.png');
    });

    it('supports setDriver with a custom driver', async () => {
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
        Storage.setDriver(customDriver);
        await Storage.put('test.txt', 'custom');
        expect((await Storage.get('test.txt')).toString()).toBe('custom');
        expect(Storage.url('test.txt')).toBe('https://cdn.example.com/test.txt');
    });

    it('throws when no driver has been injected', async () => {
        Storage.reset();
        expect(() => Storage.url('any')).toThrow('Storage driver is not registered');
    });
});

describe('S3Driver', () => {
    let driver: S3Driver;
    let sendMock: jest.Mock;

    beforeEach(() => {
        driver = new S3Driver({
            bucket: 'test-bucket',
            region: 'us-west-2',
            accessKeyId: 'fake-key',
            secretAccessKey: 'fake-secret',
        });
        sendMock = jest.fn();
        // Replace the private S3Client's send method
        (driver as any).client.send = sendMock;
    });

    describe('put', () => {
        it('sends a PutObjectCommand with string data', async () => {
            sendMock.mockResolvedValue({});
            await driver.put('docs/readme.txt', 'hello world');
            expect(sendMock).toHaveBeenCalledTimes(1);
            const command = sendMock.mock.calls[0][0];
            expect(command.constructor.name).toBe('PutObjectCommand');
            expect(command.input).toEqual({
                Bucket: 'test-bucket',
                Key: 'docs/readme.txt',
                Body: Buffer.from('hello world'),
            });
        });

        it('sends a PutObjectCommand with Buffer data', async () => {
            sendMock.mockResolvedValue({});
            const buf = Buffer.from([0x01, 0x02, 0x03]);
            await driver.put('binary.bin', buf);
            const command = sendMock.mock.calls[0][0];
            expect(command.input.Body).toEqual(buf);
        });

        it('propagates S3 errors on put', async () => {
            sendMock.mockRejectedValue(new Error('AccessDenied'));
            await expect(driver.put('file.txt', 'data')).rejects.toThrow('AccessDenied');
        });
    });

    describe('get', () => {
        function mockBodyStream(content: Buffer) {
            const readable = new Readable();
            readable.push(content);
            readable.push(null);
            const sdkStream = sdkStreamMixin(readable);
            return sdkStream;
        }

        it('returns file content as a Buffer', async () => {
            const body = mockBodyStream(Buffer.from('file content'));
            sendMock.mockResolvedValue({ Body: body });
            const result = await driver.get('test.txt');
            expect(result).toEqual(Buffer.from('file content'));
            const command = sendMock.mock.calls[0][0];
            expect(command.constructor.name).toBe('GetObjectCommand');
            expect(command.input).toEqual({
                Bucket: 'test-bucket',
                Key: 'test.txt',
            });
        });

        it('throws when response body is empty', async () => {
            sendMock.mockResolvedValue({ Body: undefined });
            await expect(driver.get('empty.txt')).rejects.toThrow('Empty response body for key: empty.txt');
        });

        it('propagates S3 errors on get', async () => {
            sendMock.mockRejectedValue(new Error('NoSuchKey'));
            await expect(driver.get('missing.txt')).rejects.toThrow('NoSuchKey');
        });
    });

    describe('delete', () => {
        it('sends a DeleteObjectCommand', async () => {
            sendMock.mockResolvedValue({});
            await driver.delete('old-file.txt');
            expect(sendMock).toHaveBeenCalledTimes(1);
            const command = sendMock.mock.calls[0][0];
            expect(command.constructor.name).toBe('DeleteObjectCommand');
            expect(command.input).toEqual({
                Bucket: 'test-bucket',
                Key: 'old-file.txt',
            });
        });

        it('propagates S3 errors on delete', async () => {
            sendMock.mockRejectedValue(new Error('AccessDenied'));
            await expect(driver.delete('file.txt')).rejects.toThrow('AccessDenied');
        });
    });

    describe('exists', () => {
        it('returns true when HeadObject succeeds', async () => {
            sendMock.mockResolvedValue({});
            const result = await driver.exists('present.txt');
            expect(result).toBe(true);
            const command = sendMock.mock.calls[0][0];
            expect(command.constructor.name).toBe('HeadObjectCommand');
            expect(command.input).toEqual({
                Bucket: 'test-bucket',
                Key: 'present.txt',
            });
        });

        it('returns false when HeadObject throws', async () => {
            sendMock.mockRejectedValue(new Error('NotFound'));
            const result = await driver.exists('missing.txt');
            expect(result).toBe(false);
        });
    });

    describe('url', () => {
        it('returns standard S3 URL', () => {
            const url = driver.url('images/photo.jpg');
            expect(url).toBe('https://test-bucket.s3.us-west-2.amazonaws.com/images/photo.jpg');
        });

        it('uses default region us-east-1 when not specified', () => {
            const defaultDriver = new S3Driver({ bucket: 'my-bucket' });
            expect(defaultDriver.url('file.txt')).toBe('https://my-bucket.s3.us-east-1.amazonaws.com/file.txt');
        });

        it('returns custom endpoint URL when endpoint is set', () => {
            const minioDriver = new S3Driver({
                bucket: 'local-bucket',
                endpoint: 'http://localhost:9000',
            });
            expect(minioDriver.url('data.csv')).toBe('http://localhost:9000/local-bucket/data.csv');
        });

        it('strips trailing slash from custom endpoint', () => {
            const minioDriver = new S3Driver({
                bucket: 'local-bucket',
                endpoint: 'http://localhost:9000/',
            });
            expect(minioDriver.url('data.csv')).toBe('http://localhost:9000/local-bucket/data.csv');
        });
    });

    describe('driver injection via Storage facade', () => {
        it('can be injected and used through the Storage facade', async () => {
            const s3 = new S3Driver({ bucket: 'facade-bucket', region: 'eu-west-1' });
            const mockSend = jest.fn().mockResolvedValue({});
            (s3 as any).client.send = mockSend;

            Storage.setDriver(s3);

            await Storage.put('test.txt', 'hello');
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(Storage.url('test.txt')).toBe('https://facade-bucket.s3.eu-west-1.amazonaws.com/test.txt');
        });
    });
});

describe('storage config', () => {
    afterEach(() => {
        jest.resetModules();
        jest.dontMock('@/config/variables');
    });

    it('always registers the local disk driver', async () => {
        jest.doMock('@/config/variables', () => {
            const actual = jest.requireActual('@/config/variables');
            return {
                ...actual,
                default: {
                    ...actual.default,
                    STORAGE_DRIVER: 's3',
                    AWS_S3_BUCKET: undefined,
                },
            };
        });

        const { configureStorageDriver } = await import('@/storage/config');
        const { Storage } = await import('@/primitives/storage');

        expect(() => configureStorageDriver()).not.toThrow();
        expect(Storage.url('avatar.png')).toBe('/storage/avatar.png');
    });
});

describe('LocalDiskDriver', () => {
    it('defaults url() to an internal /storage path when no base URL is provided', () => {
        const driver = new LocalDiskDriver();
        expect(driver.url('avatar.png')).toBe('/storage/avatar.png');
    });
});
