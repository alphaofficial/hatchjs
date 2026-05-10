import { MikroORM } from '@mikro-orm/core';
import ormConfig from '@/adapters/outbound/persistence/orm.config';
import { PinoLogger } from '@/adapters/shared/logger/pinoLogger';
import { Scheduler } from '@/adapters/shared/scheduler';
import { startScheduler } from '@/scheduler';

describe('scheduler', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('starts with the moved shared scheduler and persistence config', async () => {
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
});
