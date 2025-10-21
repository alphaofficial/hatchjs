import express from 'express';
import path from 'path';
import routes from './routes/route';
import ormConfig from './database/orm.config';
import { Example } from './models/Example';
import { MikroORM, RequestContext } from '@mikro-orm/core';

declare module "express-serve-static-core" {
	interface Request {
		orm: MikroORM;
	}
}

const app = express();
const port = 3000;

async function bootstrap() {
  const orm = await MikroORM.init(ormConfig);

  app.use((req, _, next) => {
		req.orm = orm;
		next();
	});

  app.use((_, __, next) =>
		RequestContext.create(orm.em.fork(), next),
	);
  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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