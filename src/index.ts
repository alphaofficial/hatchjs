import express from 'express';
import path from 'path';
import routes from './routes/route';
import ormConfig from './database/orm.config';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { PinoLogger } from './logger/pinoLogger';

declare module "express-serve-static-core" {
	interface Request {
		orm: MikroORM;
    logger: PinoLogger;
	}
}

const app = express();
const port = 3000;

async function bootstrap() {
  const orm = await MikroORM.init(ormConfig);

  app.use((req, _, next) => {
		req.orm = orm;
    req.logger = PinoLogger;
		next();
	});

  app.use((_, __, next) =>
		RequestContext.create(orm.em.fork(), next),
	);
  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(PinoLogger.instance);

  // Serve static files from public directory (template.html)
  app.use('/', express.static(path.join(process.cwd(), 'public')));

  // Serve built assets from dist directory
  app.use('/', express.static(path.join(process.cwd(), 'dist')));

  // Routes
  app.use('/', routes);

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

bootstrap().catch(err => {
  console.error('Error during bootstrap:', err);
});

export default app;