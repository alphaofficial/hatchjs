import { Queue } from '@/primitives/queue';
import type { QueueDriver } from '@/primitives/ports/queue';

describe('queue dispatch', () => {
    afterEach(() => {
        Queue.reset();
    });

    it('is a no-op when DATABASE_URL is not set', async () => {
        const prev = process.env.DATABASE_URL;
        try {
            delete process.env.DATABASE_URL;
            await expect(Queue.dispatch('send-email', { to: 'test@example.com' })).resolves.toBeUndefined();
        } finally {
            if (prev === undefined) delete process.env.DATABASE_URL;
            else process.env.DATABASE_URL = prev;
        }
    });

    it('accepts a job name and payload without throwing when DATABASE_URL is absent', async () => {
        const prev = process.env.DATABASE_URL;
        try {
            delete process.env.DATABASE_URL;
            await expect(Queue.dispatch('process-order', { orderId: 42 })).resolves.not.toThrow();
        } finally {
            if (prev === undefined) delete process.env.DATABASE_URL;
            else process.env.DATABASE_URL = prev;
        }
    });

    it('dispatches with no payload argument when DATABASE_URL is absent', async () => {
        const prev = process.env.DATABASE_URL;
        try {
            delete process.env.DATABASE_URL;
            await expect(Queue.dispatch('cleanup')).resolves.toBeUndefined();
        } finally {
            if (prev === undefined) delete process.env.DATABASE_URL;
            else process.env.DATABASE_URL = prev;
        }
    });

    it('delegates dispatch to an injected driver', async () => {
        const calls: Array<{ jobName: string; payload: unknown }> = [];
        const driver: QueueDriver = {
            dispatch: async (jobName, payload) => { calls.push({ jobName, payload }); },
        };

        Queue.setDriver(driver);

        await Queue.dispatch('process-order', { orderId: 42 });

        expect(calls).toEqual([{ jobName: 'process-order', payload: { orderId: 42 } }]);
    });

    it('passes an empty object payload when no payload is supplied to an injected driver', async () => {
        const calls: unknown[] = [];
        Queue.setDriver({
            dispatch: async (_jobName, payload) => { calls.push(payload); },
        });

        await Queue.dispatch('cleanup');

        expect(calls).toEqual([{}]);
    });

    it('throws a clear error when dispatching without a driver', async () => {
        Queue.reset();
        await expect(Queue.dispatch('missing')).rejects.toThrow('Queue driver is not registered');
    });
});
