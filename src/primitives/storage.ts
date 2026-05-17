import type { StorageDriver } from '@/primitives/ports/storage';

export type { StorageDriver } from '@/primitives/ports/storage';

let activeDriver: StorageDriver | null = null;

export class Storage {
    static setDriver(driver: StorageDriver): void {
        activeDriver = driver;
    }

    static reset(): void {
        activeDriver = null;
    }

    static put(filePath: string, data: Buffer | string): Promise<void> {
        return this.getActiveDriver().put(filePath, data);
    }

    static get(filePath: string): Promise<Buffer> {
        return this.getActiveDriver().get(filePath);
    }

    static delete(filePath: string): Promise<void> {
        return this.getActiveDriver().delete(filePath);
    }

    static url(filePath: string): string {
        return this.getActiveDriver().url(filePath);
    }

    static exists(filePath: string): Promise<boolean> {
        return this.getActiveDriver().exists(filePath);
    }

    private static getActiveDriver(): StorageDriver {
        if (!activeDriver) {
            throw new Error('Storage driver is not registered');
        }
        return activeDriver;
    }
}
