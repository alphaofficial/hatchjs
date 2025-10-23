import 'dotenv-defaults/config';
import express from 'express';
import session from 'express-session';
import path from 'path';
import routes from './routes/route';
import ormConfig from './database/orm.config';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { PinoLogger } from './logger/pinoLogger';
import variables from './config/variables';
import { User } from './models/User';
import { SessionStore } from './middleware/sessionStore';

declare module "express-serve-static-core" {
	interface Request {
		orm: MikroORM;
    logger: PinoLogger;
    user(): Promise<User | null>;
    user_id(): User["id"] | null;
    is_authenticated(): boolean;
    is_guest(): boolean;
    authenticate(user: User): void;
    logout(): Promise<void>;
	}
}

const app = express();
const port = variables.PORT

async function bootstrap() {
  const orm = await MikroORM.init(ormConfig);
  const sessionStore = new SessionStore(orm);

  app.use((req, _, next) => {
		req.orm = orm;
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
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: variables.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: variables.SESSION_MAX_AGE,
    }
  }));

  // inject authentication helper methods into request
  app.use((req, _, next) => {
    const { injectAuthHelpers } = require('./middleware/authUtils');
    injectAuthHelpers(req, _, next);
  });

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(PinoLogger.instance);

  // Serve static files from public directory (template.html)
  app.use('/', express.static(path.join(process.cwd(), 'public')));

  // Routes
  app.use('/', routes);

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

bootstrap().catch(err => {
  PinoLogger.error('App', "Failed to start server", err);
});

export default app;