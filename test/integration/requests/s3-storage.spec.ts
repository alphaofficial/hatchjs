import { S3Driver } from '@/adapters/outbound/storage/s3';
import { Readable } from 'stream';
import { sdkStreamMixin } from '@smithy/util-stream';

describe('s3 storage adapter', () => {
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
            return sdkStreamMixin(readable);
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

            await expect(driver.exists('missing.txt')).resolves.toBe(false);
        });
    });

    describe('url', () => {
        it('returns standard S3 URL', () => {
            expect(driver.url('images/photo.jpg')).toBe(
                'https://test-bucket.s3.us-west-2.amazonaws.com/images/photo.jpg',
            );
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
});
