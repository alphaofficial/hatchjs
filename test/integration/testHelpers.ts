import session from "express-session";
import variables from "../../src/config/variables";
import { PinoLogger } from "../../src/logger/pinoLogger";
import { MikroORM, RequestContext } from "@mikro-orm/core";
import ormConfig from "../../src/database/orm.config";
import { SessionStore, generateSessionToken } from "../../src/middleware/sessionStore";
import { verifyOrigin } from "../../src/middleware/csrf";
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import routes from "../../src/routes/route";
import path from "node:path";
import { injectAuthHelpers } from "../../src/middleware/authUtils";
import { notFoundHandler, globalErrorHandler } from "../../src/middleware/errorHandler";

declare module "express-serve-static-core" {
	interface Request {
		orm: MikroORM;
		logger: PinoLogger;
		user(): Promise<any | null>;
		user_id(): string | null;
		is_authenticated(): boolean;
		is_guest(): boolean;
		authenticate(user: any): void;
		logout(): Promise<void>;
	}
}

interface BootstrapTestAppOptions {
	dbName?: string;
}

export const bootstrapTestApp = async (options: BootstrapTestAppOptions = {}) => {
	const log = PinoLogger;
	const app = express();

	const orm = await MikroORM.init({ ...ormConfig, dbName: options.dbName ?? "express_inertia_test.db" });
	const sessionStore = new SessionStore(orm);

	app.use(helmet({ contentSecurityPolicy: false }));
	app.use(compression());

	app.get('/healthz', (_req, res) => {
		res.status(200).json({ status: 'ok' });
	});

	app.get('/readyz', async (_req, res) => {
		try {
			await orm.em.getConnection().execute('select 1');
			res.status(200).json({ status: 'ready' });
		} catch {
			res.status(503).json({ status: 'not_ready' });
		}
	});

	app.use((req, _, next) => {
		req.orm = orm;
		(req as any).entityManager = orm.em.fork();
		req.logger = log;
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
			secure: false, // Always false for tests
			httpOnly: true,
			maxAge: variables.SESSION_MAX_AGE,
		}
	}));

	// inject authentication helper methods into request
	app.use(injectAuthHelpers);

	// Middleware
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	// Serve static files from public directory (template.html)
	app.use('/', express.static(path.join(process.cwd(), 'public')));

	// CSRF defense
	app.use(verifyOrigin);

	// Routes
	app.use('/', routes);

	// 404 + error handlers
	app.use(notFoundHandler);
	app.use(globalErrorHandler);

	return { app, orm, mockLogger: log, sessionStore };
};
