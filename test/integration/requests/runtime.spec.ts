import { configureRuntimeDrivers } from '@/runtime/config';
import { Cache } from '@/primitives/cache';
import { Mailer } from '@/primitives/mail';
import { Queue } from '@/primitives/queue';
import { Scheduler } from '@/primitives/scheduler';
import { Storage } from '@/primitives/storage';
import { Emitter } from '@/primitives/events';
import type { AppEvents } from '@/events/events';
import { PinoLogger } from '@/logger/pinoLogger';
import { jobs } from '@/jobs/jobs';
import { registerSessionCleanupSchedule } from '@/scheduler';

describe('runtime primitive wiring', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        Cache.reset();
        Mailer.reset();
        Queue.reset();
        Scheduler.reset();
        Emitter.reset();
    });

    it('configures usable default drivers for cache, mail, queue, scheduler, storage, and events', async () => {
        configureRuntimeDrivers();

        await Cache.set('runtime:cache', { ok: true });
        expect(await Cache.get('runtime:cache')).toEqual({ ok: true });

        await expect(Mailer.send('to@example.com', 'Runtime mail', '<p>Hello</p>')).resolves.toBeUndefined();

        const previousDatabaseUrl = process.env.DATABASE_URL;
        try {
            delete process.env.DATABASE_URL;
            await expect(Queue.dispatch('runtime-noop', { ok: true })).resolves.toBeUndefined();
        } finally {
            if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
            else process.env.DATABASE_URL = previousDatabaseUrl;
        }

        const handle = Scheduler.schedule('* * * * *', jest.fn());
        expect(handle).toEqual(expect.objectContaining({ start: expect.any(Function), stop: expect.any(Function) }));
        handle.stop();

        const filePath = `runtime-test-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
        await Storage.put(filePath, 'runtime storage');
        expect(await Storage.exists(filePath)).toBe(true);
        expect((await Storage.get(filePath)).toString()).toBe('runtime storage');
        await Storage.delete(filePath);
        expect(await Storage.exists(filePath)).toBe(false);

        const infoSpy = jest.spyOn(PinoLogger, 'info').mockImplementation(() => undefined);
        expect(Emitter.emit<AppEvents, 'user.login'>('user.login', { id: '1', email: 'runtime@example.com' })).toBe(true);
        expect(infoSpy).toHaveBeenCalledWith(expect.objectContaining({
            scope: 'events',
            message: 'Handled user.login event',
        }));
    });

    it('registers app event handlers once under normal repeated runtime setup', () => {
        const infoSpy = jest.spyOn(PinoLogger, 'info').mockImplementation(() => undefined);

        configureRuntimeDrivers();
        configureRuntimeDrivers();

        Emitter.emit<AppEvents, 'user.login'>('user.login', { id: '2', email: 'twice@example.com' });

        expect(infoSpy).toHaveBeenCalledTimes(1);
        expect(infoSpy).toHaveBeenCalledWith(expect.objectContaining({
            scope: 'events',
            message: 'Handled user.login event',
        }));
    });

    it('registers sendWelcomeEmailJob and passes the supplied registry to the active queue worker driver', async () => {
        expect(jobs).toHaveProperty('sendWelcomeEmailJob', expect.any(Function));

        const runner = { stop: jest.fn().mockResolvedValue(undefined) };
        const start = jest.fn().mockResolvedValue(runner);
        Queue.setDriver({
            dispatch: jest.fn().mockResolvedValue(undefined),
            start,
        });

        await expect(Queue.start('postgres://runtime-worker', jobs)).resolves.toBe(runner);

        expect(start).toHaveBeenCalledWith('postgres://runtime-worker', jobs);
        expect(start.mock.calls[0][1].sendWelcomeEmailJob).toBe(jobs.sendWelcomeEmailJob);
    });

    it('registers the session cleanup scheduler entrypoint without relying on cron ticks', () => {
        const orm = {} as any;
        const scheduled: Array<{ expression: string; handler: () => void | Promise<void> }> = [];
        const handle = { start: jest.fn(), stop: jest.fn() };
        Scheduler.setDriver({
            validate: () => true,
            schedule: (expression, handler) => {
                scheduled.push({ expression, handler });
                return handle;
            },
        });

        const result = registerSessionCleanupSchedule(orm);

        expect(result).toBe(handle);
        expect(Scheduler.getRegisteredTasks()).toEqual([{ expression: '0 * * * *' }]);
        expect(scheduled).toHaveLength(1);
        expect(scheduled[0].expression).toBe('0 * * * *');
        expect(typeof scheduled[0].handler).toBe('function');
    });
});
