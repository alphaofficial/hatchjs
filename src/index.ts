import 'dotenv-defaults/config';
import express from 'express';
import session from 'express-session';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import routes from './routes/route';
import ormConfig from './database/orm.config';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { PinoLogger } from './logger/pinoLogger';
import variables from './config/variables';
import { User } from './models/User';
import { SessionStore, generateSessionToken } from './middleware/sessionStore';
import { verifyOrigin } from './middleware/csrf';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler';

declare module "express-serve-static-core" {
	interface Request {
		orm: MikroORM;
    entityManager: MikroORM['em'];
    logger: PinoLogger;
    user(): Promise<User | null>;
    user_id(): User["id"] | null;
    is_authenticated(): boolean;
    is_guest(): boolean;
    authenticate(user: User): Promise<void>;
    logout(): Promise<void>;
	}
}

const app = express();
const port = variables.PORT;

// Trust proxy headers (X-Forwarded-*) when running behind a load balancer.
app.set('trust proxy', variables.TRUST_PROXY);

async function bootstrap() {
  const orm = await MikroORM.init(ormConfig);
  const sessionStore = new SessionStore(orm);

  // Security headers. contentSecurityPolicy is left default; tweak per-app as needed.
  app.use(
    helmet({
      contentSecurityPolicy: variables.NODE_ENV === 'production' ? undefined : false,
    })
  );

  // Gzip responses.
  app.use(compression());

  // Health endpoints — registered before session/db middleware so liveness
  // probes don't allocate resources.
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/readyz', async (_req, res) => {
    try {
      await orm.em.getConnection().execute('select 1');
      res.status(200).json({ status: 'ready' });
    } catch (err) {
      res.status(503).json({ status: 'not_ready' });
    }
  });

  app.use((req, _, next) => {
		req.orm = orm;
    req.entityManager = orm.em.fork();
    req.logger = PinoLogger;
		next();
	});

  app.use((_, __, next) =>
		RequestContext.create(orm.em.fork(), next),
	);

  app.use((req, _, next) => {
    if (req.sessionID) {
      sessionStore.setRequestData(req.sessionID, req.ip || '', req.get('User-Agent') || '');
    }
    next();
  });


  // Session middleware
  app.use(session({
    store: sessionStore,
    secret: variables.SESSION_SECRET,
    genid: generateSessionToken,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: variables.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: variables.SESSION_MAX_AGE,
    }
  }));

  // inject authentication helper methods into request
  app.use((req, _, next) => {
    const { injectAuthHelpers } = require('./middleware/authUtils');
    injectAuthHelpers(req, _, next);
  });

  // Body parsers — bound to a sane size to mitigate trivial DoS.
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  app.use(PinoLogger.instance);

  // Serve static files from public directory (template.html)
  app.use('/', express.static(path.join(process.cwd(), 'public')));

  // CSRF defense: reject state-changing requests from foreign origins.
  app.use(verifyOrigin);

  // Routes
  app.use('/', routes);

  // 404 + global error handlers must be registered last.
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  const server = app.listen(port, () => {
    PinoLogger.info({ scope: 'App', message: `Server running at http://localhost:${port}` });
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    PinoLogger.info({ scope: 'App', message: `Received ${signal}, shutting down...` });
    server.close(async () => {
      try {
        await orm.close(true);
      } catch (err: any) {
        PinoLogger.error({ scope: 'App', message: 'Error closing ORM', params: { message: err?.message } });
      }
      process.exit(0);
    });
    // Force-exit after 10s if close hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch(err => {
  PinoLogger.error({ scope: 'App', message: 'Failed to start server', params: { error: err } });
  process.exit(1);
});

export default app;
