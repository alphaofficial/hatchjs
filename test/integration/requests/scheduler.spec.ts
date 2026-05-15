import { MikroORM } from '@mikro-orm/core';
import { cleanExpiredSessions } from '@/adapters/inbound/jobs/cleanExpiredSessions';
import { registerScheduledTasks } from '@/adapters/inbound/jobs/scheduledTasks';
import ormConfig from '@/adapters/outbound/persistence/orm.config';
import { PinoLogger } from '@/adapters/shared/logger/pinoLogger';
import { Scheduler } from '@/adapters/shared/scheduler';
import { Session } from '@/core/models/Session';
import { startScheduler } from '@/scheduler';

describe('scheduler', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('starts by delegating cron registration to the scheduled task registry', async () => {
		const orm = { close: jest.fn().mockResolvedValue(undefined) } as any;
		const initSpy = jest.spyOn(MikroORM, 'init').mockResolvedValue(orm);
		const scheduleSpy = jest.spyOn(Scheduler, 'schedule').mockReturnValue({} as any);
		const getRegisteredTasksSpy = jest.spyOn(Scheduler, 'getRegisteredTasks').mockReturnValue([
			{ expression: '0 * * * *' },
		]);
		const infoSpy = jest.spyOn(PinoLogger, 'info').mockImplementation(() => undefined);
		const processOnSpy = jest.spyOn(process, 'on').mockImplementation(() => process);

		await expect(startScheduler()).resolves.toBe(orm);

		expect(initSpy).toHaveBeenCalledWith(ormConfig);
		expect(scheduleSpy).toHaveBeenCalledWith('0 * * * *', expect.any(Function));
		expect(getRegisteredTasksSpy).toHaveBeenCalledTimes(1);
		expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
		expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
		expect(infoSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				scope: 'scheduler',
				message: 'Scheduler started with 1 task(s)',
				params: { tasks: ['0 * * * *'] },
			}),
		);
	});

	it('cleans expired sessions through the extracted job handler', async () => {
		jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-05-14T12:00:00.000Z').getTime());
		const nativeDelete = jest.fn().mockResolvedValue(2);
		const orm = {
			em: {
				fork: jest.fn(() => ({ nativeDelete })),
			},
		} as any;
		const infoSpy = jest.spyOn(PinoLogger, 'info').mockImplementation(() => undefined);

		await cleanExpiredSessions(orm);

		expect(orm.em.fork).toHaveBeenCalledTimes(1);
		expect(nativeDelete).toHaveBeenCalledWith(Session, { last_activity: { $lte: 1778673600 } });
		expect(infoSpy).toHaveBeenCalledWith({ scope: 'scheduler', message: 'Cleaned 2 expired session(s)' });
	});

	it('registers scheduled tasks through the explicit scheduler registry', () => {
		const orm = {} as any;
		const scheduleSpy = jest.spyOn(Scheduler, 'schedule').mockReturnValue({} as any);

		registerScheduledTasks(orm);

		expect(scheduleSpy).toHaveBeenCalledTimes(1);
		expect(scheduleSpy).toHaveBeenCalledWith('0 * * * *', expect.any(Function));
	});
});
