import { registerGracefulShutdown } from '@/primitives/http';

describe('HTTP graceful shutdown', () => {
    afterEach(() => {
        process.removeAllListeners('SIGTERM');
        process.removeAllListeners('SIGINT');
        jest.useRealTimers();
    });

    it('closes disposable resources when the server stops', async () => {
        jest.useFakeTimers();
        const first = { close: jest.fn().mockResolvedValue(undefined) };
        const second = { close: jest.fn().mockResolvedValue(undefined) };
        const exitProcess = jest.fn() as unknown as (code?: number) => never;
        const server = {
            close: jest.fn((callback: () => void) => callback()),
        };

        const shutdown = registerGracefulShutdown({
            server: server as any,
            disposables: [first, second],
            exitProcess,
        });

        await shutdown('SIGTERM');
        await Promise.resolve();

        expect(first.close).toHaveBeenCalledTimes(1);
        expect(second.close).toHaveBeenCalledTimes(1);
        expect(exitProcess).toHaveBeenCalledWith(0);
    });

    it('only shuts down once when called multiple times', async () => {
        jest.useFakeTimers();
        const disposable = { close: jest.fn().mockResolvedValue(undefined) };
        const exitProcess = jest.fn() as unknown as (code?: number) => never;
        const server = {
            close: jest.fn((callback: () => void) => callback()),
        };

        const shutdown = registerGracefulShutdown({
            server: server as any,
            disposables: [disposable],
            exitProcess,
        });

        await shutdown('SIGTERM');
        await shutdown('SIGINT');
        await Promise.resolve();

        expect(server.close).toHaveBeenCalledTimes(1);
        expect(disposable.close).toHaveBeenCalledTimes(1);
        expect(exitProcess).toHaveBeenCalledTimes(1);
    });

    it('continues closing remaining disposables when one fails', async () => {
        jest.useFakeTimers();
        const failing = { close: jest.fn().mockRejectedValue(new Error('close failed')) };
        const succeeding = { close: jest.fn().mockResolvedValue(undefined) };
        const exitProcess = jest.fn() as unknown as (code?: number) => never;
        const server = {
            close: jest.fn((callback: () => void) => callback()),
        };

        const shutdown = registerGracefulShutdown({
            server: server as any,
            disposables: [failing, succeeding],
            exitProcess,
        });

        await shutdown('SIGTERM');
        await Promise.resolve();

        expect(failing.close).toHaveBeenCalledTimes(1);
        expect(succeeding.close).toHaveBeenCalledTimes(1);
        expect(exitProcess).toHaveBeenCalledWith(0);
    });

    it('exits unsuccessfully when the HTTP server fails to close', async () => {
        jest.useFakeTimers();
        const disposable = { close: jest.fn().mockResolvedValue(undefined) };
        const exitProcess = jest.fn() as unknown as (code?: number) => never;
        const server = {
            close: jest.fn((callback: (err?: Error) => void) => callback(new Error('server failed'))),
        };

        const shutdown = registerGracefulShutdown({
            server: server as any,
            disposables: [disposable],
            exitProcess,
        });

        await shutdown('SIGTERM');
        await Promise.resolve();

        expect(disposable.close).toHaveBeenCalledTimes(1);
        expect(exitProcess).toHaveBeenCalledWith(1);
    });
});
