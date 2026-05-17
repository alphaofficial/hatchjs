export interface Disposable {
    close(): void | Promise<void>;
}
