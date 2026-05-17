import { PinoLogger } from '@/logger/pinoLogger';
import { runServer } from '@/router/app';
import { configureRuntimeDrivers } from './runtime/config';

configureRuntimeDrivers();
runServer().catch(err => {
  PinoLogger.error({
    scope: 'App',
    message: 'Failed to start server',
    params: { error: err },
  });
  process.exit(1);
});
