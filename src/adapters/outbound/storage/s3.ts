import {
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import type { StorageDriver } from '@/ports/storage';

export class S3Driver implements StorageDriver {
    private client: S3Client;
    private bucket: string;
    private region: string;
    private endpoint?: string;

    constructor(options: {
        bucket: string;
        region?: string;
        accessKeyId?: string;
        secretAccessKey?: string;
        endpoint?: string;
    }) {
        this.bucket = options.bucket;
        this.region = options.region ?? 'us-east-1';
        this.endpoint = options.endpoint;

        const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
            region: this.region,
        };

        if (options.accessKeyId && options.secretAccessKey) {
            clientConfig.credentials = {
                accessKeyId: options.accessKeyId,
                secretAccessKey: options.secretAccessKey,
            };
        }

        if (options.endpoint) {
            clientConfig.endpoint = options.endpoint;
            clientConfig.forcePathStyle = true;
        }

        this.client = new S3Client(clientConfig);
    }

    async put(filePath: string, data: Buffer | string): Promise<void> {
        const body = typeof data === 'string' ? Buffer.from(data) : data;
        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: filePath,
                Body: body,
            }),
        );
    }

    async get(filePath: string): Promise<Buffer> {
        const response = await this.client.send(
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: filePath,
            }),
        );
        const stream = response.Body;
        if (!stream) {
            throw new Error(`Empty response body for key: ${filePath}`);
        }
        return Buffer.from(await stream.transformToByteArray());
    }

    async delete(filePath: string): Promise<void> {
        await this.client.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: filePath,
            }),
        );
    }

    url(filePath: string): string {
        if (this.endpoint) {
            return `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${filePath}`;
        }
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${filePath}`;
    }

    async exists(filePath: string): Promise<boolean> {
        try {
            await this.client.send(
                new HeadObjectCommand({
                    Bucket: this.bucket,
                    Key: filePath,
                }),
            );
            return true;
        } catch {
            return false;
        }
    }
}
