import 'dotenv-defaults/config';
import express from 'express';
import type { MikroORM } from '@mikro-orm/core';
import helmet from 'helmet';
import path from 'path';
import { RequestContext } from '@mikro-orm/core';
import { PinoLogger } from '@/logger/pinoLogger';
import variables from '@/config/variables';
import { createAppContext, registerGracefulShutdown } from '@/primitives/http';
import { verifyOrigin } from '@/middleware/csrf';
import { notFoundHandler, globalErrorHandler } from '@/middleware/errorHandler';
import { injectAuthHelpers } from '@/middleware/authUtils';
import { createSessionMiddleware } from '@/middleware/session';
import { useHealthChecks } from '@/middleware/healthChecks';
import routes from './route';

const port = variables.PORT;

type BootstrapOptions = {
  app: express.Express;
  orm: MikroORM;
};

export function configureApp({ app, orm }: BootstrapOptions): express.Express {
  app.set('trust proxy', variables.TRUST_PROXY);
  app.use(
    helmet({
      contentSecurityPolicy: variables.NODE_ENV === 'production' ? undefined : false,
    }),
  );
  app.use(PinoLogger.instance);
  app.use(express.json({ limit: '100kb' }));
  app.use((_, __, next) => RequestContext.create(orm.em.fork(), next));
  app.use(createSessionMiddleware(orm));
  useHealthChecks(app);
  app.use(injectAuthHelpers);
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  app.use('/', express.static(path.join(process.cwd(), 'public')));
  app.use(verifyOrigin);
  app.use(routes);
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}

export async function runServer() {
  const { app, orm } = await createAppContext();
  configureApp({ app, orm });

  const server = app.listen(port, () => {
    PinoLogger.info({ scope: 'App', message: `Server running at http://localhost:${port}` });
  });

  registerGracefulShutdown({
    server,
    disposables: [{ close: () => orm.close(true) }],
  });

  return { app, orm, server };
}
