import 'dotenv-defaults/config';
import { Queue } from './primitives/queue';
import { PinoLogger } from './logger/pinoLogger';
import { jobs } from './jobs/jobs';
import { configureRuntimeDrivers } from './runtime/config';


const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	PinoLogger.error({ scope: 'worker', message: 'DATABASE_URL is not set. Worker requires a PostgreSQL connection.' });
	process.exit(1);
}


PinoLogger.info({ scope: 'worker', message: 'Starting Graphile Worker...' });


configureRuntimeDrivers();
Queue.start(connectionString, jobs)
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
