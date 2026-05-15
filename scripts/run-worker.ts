import 'dotenv-defaults/config';
import { workerTasks } from '@/adapters/inbound/jobs/workerTasks';
import { PinoLogger } from '@/adapters/shared/logger/pinoLogger';
import { startWorker } from '@/worker';

async function runWorkerSmoke(): Promise<void> {
	PinoLogger.warn({
		scope: 'worker',
		message: 'DATABASE_URL not set. Running local worker smoke instead.',
	});

	await workerTasks.sendWelcomeEmail({ to: 'smoke@example.com', name: 'Smoke Test' });

	PinoLogger.info({
		scope: 'worker',
		message: 'Worker smoke completed without PostgreSQL.',
	});
}

if (process.env.DATABASE_URL) {
	startWorker().catch(err => {
		PinoLogger.error({ scope: 'worker', message: 'Worker failed to start', params: { error: err } });
		process.exit(1);
	});
} else {
	runWorkerSmoke().catch(err => {
		PinoLogger.error({ scope: 'worker', message: 'Worker smoke failed', params: { error: err } });
		process.exit(1);
	});
}
