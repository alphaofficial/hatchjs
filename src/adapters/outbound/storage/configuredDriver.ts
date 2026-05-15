import type { StorageDriver } from '@/ports/storage';
import { LocalDiskDriver } from './local';
import { S3Driver } from './s3';

const drivers = new Map<string, StorageDriver>();

function initDrivers(): void {
    const storagePath = process.env.STORAGE_PATH ?? 'storage';
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

    drivers.set('local', new LocalDiskDriver(storagePath, appUrl));

    const s3Bucket = process.env.AWS_S3_BUCKET;
    if (s3Bucket) {
        drivers.set(
            's3',
            new S3Driver({
                bucket: s3Bucket,
                region: process.env.AWS_REGION,
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                endpoint: process.env.AWS_S3_ENDPOINT,
            }),
        );
    }
}

initDrivers();

export function registerStorageDriver(name: string, driver: StorageDriver): void {
    drivers.set(name, driver);
}

export function resolveStorageDriver(): StorageDriver {
    const driverName = process.env.STORAGE_DRIVER ?? 'local';
    const driver = drivers.get(driverName);
    if (!driver) {
        throw new Error(`Storage driver '${driverName}' is not registered`);
    }
    return driver;
}
