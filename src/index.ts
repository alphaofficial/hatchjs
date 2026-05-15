import 'dotenv-defaults/config';
import express from 'express';
import session from 'express-session';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import ormConfig from './adapters/outbound/persistence/orm.config';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { PinoLogger } from './adapters/shared/logger/pinoLogger';
import variables from './config/variables';
import { User } from '@/core/models/User';
import { createRoutes } from '@/adapters/inbound/http/routes/route';
import { AuthController } from '@/adapters/inbound/http/controllers/AuthController';
import { PublicController } from '@/adapters/inbound/http/controllers/PublicController';
import { AboutController } from '@/adapters/inbound/http/controllers/AboutController';
import { UserController } from '@/adapters/inbound/http/controllers/UserController';
import { SessionStore, generateSessionToken } from '@/adapters/inbound/http/middleware/sessionStore';
import { verifyOrigin } from '@/adapters/inbound/http/middleware/csrf';
import { notFoundHandler, globalErrorHandler } from '@/adapters/inbound/http/middleware/errorHandler';
import { injectAuthHelpers } from '@/adapters/inbound/http/middleware/authUtils';
import { MemoryCache } from '@/adapters/outbound/cache/memory';
import { LogTransport } from '@/adapters/outbound/mail/log';
import { SmtpTransport } from '@/adapters/outbound/mail/smtp';
import { LocalDiskDriver } from '@/adapters/outbound/storage/local';
import { S3Driver } from '@/adapters/outbound/storage/s3';
import { MikroOrmUserRepository } from '@/adapters/outbound/persistence/MikroOrmUserRepository';
import { Hash } from '@/adapters/outbound/crypto/Hash';
import { Emitter } from '@/adapters/shared/events';
import { LoginUser } from '@/core/use-cases/LoginUser';
import { RegisterUser } from '@/core/use-cases/RegisterUser';
import { ForgotPassword } from '@/core/use-cases/ForgotPassword';
import { ResetPassword } from '@/core/use-cases/ResetPassword';
import { VerifyEmail } from '@/core/use-cases/VerifyEmail';
import { ResendVerification } from '@/core/use-cases/ResendVerification';
import type { CacheDriver } from '@/ports/cache';
import type { MailTransport } from '@/ports/mail';
import type { StorageDriver } from '@/ports/storage';
import crypto from 'crypto';
import type { Express } from 'express';

declare module "express-serve-static-core" {
	interface Request {
		orm: MikroORM;
    logger: PinoLogger;
    user(): Promise<User | null>;
    user_id(): User["id"] | null;
    is_authenticated(): boolean;
    is_guest(): boolean;
    authenticate(user: User): Promise<void>;
    logout(): Promise<void>;
	}
}

interface VerificationPayload {
    id: string;
    email: string;
    iat: number;
}

type VerificationTokenResult =
    | { status: 'invalid' }
    | { status: 'expired' }
    | { status: 'valid'; payload: Pick<VerificationPayload, 'id' | 'email'> };

function createCacheDriver(): CacheDriver {
  switch (variables.CACHE_DRIVER) {
    case 'memory':
      return new MemoryCache();
    default:
      throw new Error(`Cache driver '${variables.CACHE_DRIVER}' is not registered`);
  }
}

function createStorageDriver(): StorageDriver {
  switch (variables.STORAGE_DRIVER) {
    case 'local':
      return new LocalDiskDriver(variables.STORAGE_PATH, variables.APP_URL);
    case 's3':
      if (!variables.AWS_S3_BUCKET) {
        throw new Error("Storage driver 's3' requires AWS_S3_BUCKET to be configured");
      }
      return new S3Driver({
        bucket: variables.AWS_S3_BUCKET,
        region: variables.AWS_REGION,
        accessKeyId: variables.AWS_ACCESS_KEY_ID,
        secretAccessKey: variables.AWS_SECRET_ACCESS_KEY,
        endpoint: variables.AWS_S3_ENDPOINT,
      });
    default:
      throw new Error(`Storage driver '${variables.STORAGE_DRIVER}' is not registered`);
  }
}

function createMailTransport(): MailTransport {
  const transport =
    variables.MAIL_DRIVER === 'smtp'
      ? new SmtpTransport()
      : variables.MAIL_DRIVER === 'log'
        ? new LogTransport()
        : null;

  if (!transport) {
    throw new Error(`Mail driver '${variables.MAIL_DRIVER}' is not registered`);
  }

  return {
    sendMail: message =>
      transport.sendMail({
        ...message,
        from: message.from ?? variables.MAIL_FROM,
      }),
  };
}

function createVerificationTokens() {
  const makeVerificationToken = (user: Pick<User, 'id' | 'email'>): string => {
    const payload = Buffer.from(
      JSON.stringify({ id: user.id, email: user.email, iat: Date.now() }),
    ).toString('base64url');
    const signature = crypto.createHmac('sha256', variables.APP_KEY).update(payload).digest('hex');
    return `${payload}.${signature}`;
  };

  const readVerificationToken = (token: string): VerificationTokenResult => {
    const dot = token.lastIndexOf('.');
    if (dot < 0) {
      return { status: 'invalid' };
    }

    const payload = token.slice(0, dot);
    const signature = token.slice(dot + 1);
    const expected = crypto.createHmac('sha256', variables.APP_KEY).update(payload).digest('hex');
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return { status: 'invalid' };
    }

    let parsedPayload: VerificationPayload;

    try {
      parsedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as VerificationPayload;
    } catch {
      return { status: 'invalid' };
    }

    const expiryMs = variables.EMAIL_VERIFICATION_EXPIRY * 60 * 1000;
    if (Date.now() - parsedPayload.iat > expiryMs) {
      return { status: 'expired' };
    }

    return {
      status: 'valid',
      payload: { id: parsedPayload.id, email: parsedPayload.email },
    };
  };

  return { makeVerificationToken, readVerificationToken };
}

export function createHttpApp(orm: MikroORM): { app: Express; sessionStore: SessionStore } {
  const app = express();
  const sessionStore = new SessionStore(orm);
  const cacheDriver = createCacheDriver();
  const storageDriver = createStorageDriver();
  const mailTransport = createMailTransport();
  const userRepository = new MikroOrmUserRepository(orm);
  const emit = Emitter.emit.bind(Emitter);
  const { makeVerificationToken, readVerificationToken } = createVerificationTokens();

  const authController = AuthController.fromDependencies({
    loginUser: new LoginUser({
      users: userRepository,
      hasher: Hash,
      emit,
    }),
    registerUser: new RegisterUser({
      users: userRepository,
      hasher: Hash,
      mailTransport,
      emit,
      appName: variables.APP_NAME,
      appUrl: variables.APP_URL,
      uuid: crypto.randomUUID,
      makeVerificationToken,
    }),
    forgotPassword: new ForgotPassword({
      users: userRepository,
      mailTransport,
      appUrl: variables.APP_URL,
      passwordResetExpiryMinutes: variables.PASSWORD_RESET_EXPIRY,
      createResetToken: () => {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto
          .createHmac('sha256', variables.APP_KEY)
          .update(rawToken)
          .digest('hex');

        return { rawToken, tokenHash };
      },
      now: () => new Date(),
    }),
    resetPassword: new ResetPassword({
      users: userRepository,
      hasher: Hash,
      passwordResetExpiryMinutes: variables.PASSWORD_RESET_EXPIRY,
      makeTokenHash: token =>
        crypto.createHmac('sha256', variables.APP_KEY).update(token).digest('hex'),
      now: () => new Date(),
    }),
    verifyEmail: new VerifyEmail({
      users: userRepository,
      emit,
      now: () => new Date(),
    }),
    resendVerification: new ResendVerification({
      mailTransport,
      appUrl: variables.APP_URL,
      makeVerificationToken,
    }),
    readVerificationToken,
  });

  const routes = createRoutes({
    authController,
  });

  app.locals.cacheDriver = cacheDriver;
  app.locals.storageDriver = storageDriver;
  app.locals.mailTransport = mailTransport;

  // Trust proxy headers (X-Forwarded-*) when running behind a load balancer.
  app.set('trust proxy', variables.TRUST_PROXY);

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
  app.use(injectAuthHelpers);

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

  return { app, sessionStore };
}

export async function bootstrap() {
  const orm = await MikroORM.init(ormConfig);
  const { app } = createHttpApp(orm);

  const server = app.listen(variables.PORT, () => {
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

  return { app, orm, server };
}

const port = variables.PORT;

if (require.main === module) {
  bootstrap().catch(err => {
    PinoLogger.error({ scope: 'App', message: 'Failed to start server', params: { error: err } });
    process.exit(1);
  });
}
