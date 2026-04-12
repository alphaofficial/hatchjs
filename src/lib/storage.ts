import fs from 'fs/promises';
import path from 'path';

export interface StorageDriver {
    put(filePath: string, data: Buffer | string): Promise<void>;
    get(filePath: string): Promise<Buffer>;
    delete(filePath: string): Promise<void>;
    url(filePath: string): string;
    exists(filePath: string): Promise<boolean>;
}

class LocalDiskDriver implements StorageDriver {
    private basePath: string;
    private baseUrl: string;

    constructor(basePath: string, baseUrl: string) {
        this.basePath = basePath;
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    private resolve(filePath: string): string {
        return path.join(this.basePath, filePath);
    }

    async put(filePath: string, data: Buffer | string): Promise<void> {
        const fullPath = this.resolve(filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, data);
    }

    async get(filePath: string): Promise<Buffer> {
        return fs.readFile(this.resolve(filePath));
    }

    async delete(filePath: string): Promise<void> {
        await fs.unlink(this.resolve(filePath));
    }

    url(filePath: string): string {
        return `${this.baseUrl}/storage/${filePath}`;
    }

    async exists(filePath: string): Promise<boolean> {
        try {
            await fs.access(this.resolve(filePath));
            return true;
        } catch {
            return false;
        }
    }
}

class MemoryDriver implements StorageDriver {
    private store = new Map<string, Buffer>();
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    async put(filePath: string, data: Buffer | string): Promise<void> {
        this.store.set(filePath, Buffer.isBuffer(data) ? data : Buffer.from(data));
    }

    async get(filePath: string): Promise<Buffer> {
        const data = this.store.get(filePath);
        if (!data) throw new Error(`File not found: ${filePath}`);
        return data;
    }

    async delete(filePath: string): Promise<void> {
        this.store.delete(filePath);
    }

    url(filePath: string): string {
        return `${this.baseUrl}/storage/${filePath}`;
    }

    async exists(filePath: string): Promise<boolean> {
        return this.store.has(filePath);
    }
}

const drivers = new Map<string, StorageDriver>();

export function registerDriver(name: string, driver: StorageDriver): void {
    drivers.set(name, driver);
}

function getDriver(): StorageDriver {
    const name = process.env.STORAGE_DRIVER ?? 'local';
    const driver = drivers.get(name);
    if (!driver) {
        throw new Error(`Storage driver '${name}' is not registered`);
    }
    return driver;
}

function initDrivers(): void {
    const storagePath = process.env.STORAGE_PATH ?? 'storage';
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    drivers.set('local', new LocalDiskDriver(storagePath, appUrl));
    drivers.set('memory', new MemoryDriver(appUrl));
}

initDrivers();

export const storage = {
    put: (filePath: string, data: Buffer | string) => getDriver().put(filePath, data),
    get: (filePath: string) => getDriver().get(filePath),
    delete: (filePath: string) => getDriver().delete(filePath),
    url: (filePath: string) => getDriver().url(filePath),
    exists: (filePath: string) => getDriver().exists(filePath),
    registerDriver,
};
