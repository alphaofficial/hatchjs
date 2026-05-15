import type { QueueDriver } from '@/ports/queue';

describe('queue port', () => {
    it('supports the expected QueueDriver contract', async () => {
        const calls: unknown[][] = [];
        const queue: QueueDriver = {
            dispatch: async (jobName, payload = {}) => {
                calls.push(['dispatch', jobName, payload]);
            },
        };

        await queue.dispatch('send-welcome-email', { userId: 1 });
        await queue.dispatch('cleanup');

        expect(calls).toEqual([
            ['dispatch', 'send-welcome-email', { userId: 1 }],
            ['dispatch', 'cleanup', {}],
        ]);
    });
});
