import 'dotenv-defaults/config';
import type { Runner } from 'graphile-worker';
import { workerTasks } from '@/adapters/inbound/jobs/workerTasks';
import { Queue } from '@/adapters/outbound/queue/graphileWorker';
import { PinoLogger } from '@/adapters/shared/logger/pinoLogger';

function registerShutdown(runner: Runner): void {
	const shutdown = async () => {
		PinoLogger.info({ scope: 'worker', message: 'Shutting down worker...' });
		await runner.stop();
		process.exit(0);
	};

	process.on('SIGTERM', shutdown);
	process.on('SIGINT', shutdown);
}

export async function startWorker(connectionString = process.env.DATABASE_URL): Promise<Runner> {
	if (!connectionString) {
		throw new Error('DATABASE_URL is not set. Worker requires a PostgreSQL connection.');
	}

	PinoLogger.info({ scope: 'worker', message: 'Starting Graphile Worker...' });

	const runner = await Queue.start(connectionString, workerTasks);

	PinoLogger.info({ scope: 'worker', message: 'Worker started and listening for jobs.' });
	registerShutdown(runner);

	return runner;
}

if (require.main === module) {
	startWorker().catch(err => {
		if (err instanceof Error && err.message === 'DATABASE_URL is not set. Worker requires a PostgreSQL connection.') {
			PinoLogger.error({ scope: 'worker', message: err.message });
		} else {
			PinoLogger.error({ scope: 'worker', message: 'Worker failed to start', params: { error: err } });
		}
		process.exit(1);
	});
}
