import { dispatch } from '@/lib/queue';

describe('queue dispatch', () => {
    it('is a no-op when DATABASE_URL is not set', async () => {
        const prev = process.env.DATABASE_URL;
        try {
            delete process.env.DATABASE_URL;
            await expect(dispatch('send-email', { to: 'test@example.com' })).resolves.toBeUndefined();
        } finally {
            if (prev === undefined) delete process.env.DATABASE_URL;
            else process.env.DATABASE_URL = prev;
        }
    });

    it('accepts a job name and payload without throwing when DATABASE_URL is absent', async () => {
        const prev = process.env.DATABASE_URL;
        try {
            delete process.env.DATABASE_URL;
            await expect(dispatch('process-order', { orderId: 42 })).resolves.not.toThrow();
        } finally {
            if (prev === undefined) delete process.env.DATABASE_URL;
            else process.env.DATABASE_URL = prev;
        }
    });

    it('dispatches with no payload argument when DATABASE_URL is absent', async () => {
        const prev = process.env.DATABASE_URL;
        try {
            delete process.env.DATABASE_URL;
            await expect(dispatch('cleanup')).resolves.toBeUndefined();
        } finally {
            if (prev === undefined) delete process.env.DATABASE_URL;
            else process.env.DATABASE_URL = prev;
        }
    });
});
