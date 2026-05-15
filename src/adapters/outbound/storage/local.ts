import fs from 'fs/promises';
import path from 'path';
import type { StorageDriver } from '@/ports/storage';

export class LocalDiskDriver implements StorageDriver {
    private basePath: string;
    private baseUrl: string;

    constructor(basePath: string, baseUrl: string) {
        this.basePath = basePath;
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    private resolve(filePath: string): string {
        const resolved = path.resolve(this.basePath, filePath);
        const base = path.resolve(this.basePath);
        if (!resolved.startsWith(base + path.sep) && resolved !== base) {
            throw new Error(`Invalid file path: "${filePath}" escapes the storage directory`);
        }
        return resolved;
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
