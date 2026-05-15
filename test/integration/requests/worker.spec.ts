import { Queue } from '@/adapters/outbound/queue/graphileWorker';
import { workerTasks } from '@/adapters/inbound/jobs/workerTasks';
import { PinoLogger } from '@/adapters/shared/logger/pinoLogger';
import { startWorker } from '@/worker';

describe('worker', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('starts with the moved inbound job handler and consumes a sendWelcomeEmail task', async () => {
		const runner = { stop: jest.fn().mockResolvedValue(undefined) } as any;
		const infoSpy = jest.spyOn(PinoLogger, 'info').mockImplementation(() => undefined);
		const processOnSpy = jest.spyOn(process, 'on').mockImplementation(() => process);
		const queueStartSpy = jest.spyOn(Queue, 'start').mockImplementation(async (connectionString, registeredTasks) => {
			expect(connectionString).toBe('postgres://worker.test/theboringarchitecture');
			expect(registeredTasks).toBe(workerTasks);
			expect(workerTasks).toHaveProperty('sendWelcomeEmail');
			await registeredTasks.sendWelcomeEmail({ to: 'worker@example.com', name: 'Worker Test' });
			return runner;
		});

		await expect(startWorker('postgres://worker.test/theboringarchitecture')).resolves.toBe(runner);

		expect(queueStartSpy).toHaveBeenCalledTimes(1);
		expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
		expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
		expect(infoSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				scope: 'job:sendWelcomeEmail',
				params: { to: 'worker@example.com', name: 'Worker Test' },
			}),
		);
	});

	it('rejects startup when DATABASE_URL is missing', async () => {
		await expect(startWorker(undefined)).rejects.toThrow(
			'DATABASE_URL is not set. Worker requires a PostgreSQL connection.',
		);
	});
});
