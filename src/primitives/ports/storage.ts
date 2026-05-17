export interface StorageDriver {
    put(filePath: string, data: Buffer | string): Promise<void>;
    get(filePath: string): Promise<Buffer>;
    delete(filePath: string): Promise<void>;
    url(filePath: string): string;
    exists(filePath: string): Promise<boolean>;
}
