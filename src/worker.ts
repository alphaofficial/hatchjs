import 'dotenv-defaults/config';
import { Queue } from './lib/queue';
import { sendWelcomeEmail } from './jobs/sendWelcomeEmail';
import { PinoLogger } from './logger/pinoLogger';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	PinoLogger.error({ scope: 'worker', message: 'DATABASE_URL is not set. Worker requires a PostgreSQL connection.' });
	process.exit(1);
}

const taskList = {
	sendWelcomeEmail,
};

PinoLogger.info({ scope: 'worker', message: 'Starting Graphile Worker...' });

Queue.start(connectionString, taskList)
	.then(runner => {
		PinoLogger.info({ scope: 'worker', message: 'Worker started and listening for jobs.' });
		const shutdown = async () => {
			PinoLogger.info({ scope: 'worker', message: 'Shutting down worker...' });
			await runner.stop();
			process.exit(0);
		};
		process.on('SIGTERM', shutdown);
		process.on('SIGINT', shutdown);
	})
	.catch(err => {
		PinoLogger.error({ scope: 'worker', message: 'Worker failed to start', params: { error: err } });
		process.exit(1);
	});
