import { Scheduler } from '@/primitives/scheduler';
import type { ScheduledHandle, SchedulerEngine } from '@/primitives/ports/scheduler';

describe('scheduler primitive', () => {
    afterEach(() => {
        Scheduler.reset();
    });

    it('delegates scheduling to an injected engine', () => {
        const scheduled: Array<{ expression: string; handler: () => void | Promise<void> }> = [];
        const handle: ScheduledHandle = { start: jest.fn(), stop: jest.fn() };
        const engine: SchedulerEngine = {
            validate: jest.fn(() => true),
            schedule: jest.fn((expression, handler) => {
                scheduled.push({ expression, handler });
                return handle;
            }),
        };

        Scheduler.setDriver(engine);
        const result = Scheduler.schedule('* * * * *', jest.fn());

        expect(result).toBe(handle);
        expect(engine.validate).toHaveBeenCalledWith('* * * * *');
        expect(engine.schedule).toHaveBeenCalledTimes(1);
        expect(scheduled[0].expression).toBe('* * * * *');
    });

    it('throws on invalid cron expressions through the active engine', () => {
        Scheduler.setDriver({
            validate: () => false,
            schedule: jest.fn(),
        });

        expect(() => Scheduler.schedule('not cron', jest.fn())).toThrow('Invalid cron expression: "not cron"');
    });

    it('startAll and stopAll operate on registered handles', () => {
        const handles: ScheduledHandle[] = [
            { start: jest.fn(), stop: jest.fn() },
            { start: jest.fn(), stop: jest.fn() },
        ];
        let index = 0;
        Scheduler.setDriver({
            validate: () => true,
            schedule: () => handles[index++],
        });

        Scheduler.schedule('* * * * *', jest.fn());
        Scheduler.schedule('*/5 * * * *', jest.fn());

        Scheduler.startAll();
        Scheduler.stopAll();

        expect(handles[0].start).toHaveBeenCalledTimes(1);
        expect(handles[1].start).toHaveBeenCalledTimes(1);
        expect(handles[0].stop).toHaveBeenCalledTimes(1);
        expect(handles[1].stop).toHaveBeenCalledTimes(1);
    });

    it('returns registered task expression metadata without engine internals', () => {
        Scheduler.setDriver({
            validate: () => true,
            schedule: () => ({ start: jest.fn(), stop: jest.fn() }),
        });

        Scheduler.schedule('* * * * *', jest.fn());

        expect(Scheduler.getRegisteredTasks()).toEqual([{ expression: '* * * * *' }]);
    });
});
