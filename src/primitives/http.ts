import express from 'express';
import { PinoLogger } from '@/logger/pinoLogger';
import type { Disposable } from '@/primitives/ports/disposable';
import ormConfig from '@/database/orm.config';
import { MikroORM } from '@mikro-orm/core';
import compression from 'compression';

export async function createAppContext(): Promise<{ app: express.Express; orm: MikroORM }> {
    const app = express();

    const orm = await MikroORM.init(ormConfig);

    app.use(compression());
    app.use((req, _, next) => {
        req.orm = orm;
        req.entityManager = orm.em.fork();
        req.logger = PinoLogger;
        next();
    });

    return { app, orm };
}

export async function createHttpApp(): Promise<express.Express> {
    const { app } = await createAppContext();
    return app;
}

type GracefulShutdownOptions = {
    server: ReturnType<express.Express['listen']>;
    disposables?: Disposable[];
    exitProcess?: (code?: number) => never;
};

export function registerGracefulShutdown({
    server,
    disposables = [],
    exitProcess = process.exit,
}: GracefulShutdownOptions) {
    let shuttingDown = false;
    let forceExitTimer: NodeJS.Timeout | undefined;

    const shutdown = async (signal: string) => {
        if (shuttingDown) return;
        shuttingDown = true;

        PinoLogger.info({ scope: 'App', message: `Received ${signal}, shutting down...` });
        server.close(async (serverCloseError?: Error) => {
            if (serverCloseError) {
                PinoLogger.error({
                    scope: 'App',
                    message: 'Error closing HTTP server',
                    params: { message: serverCloseError.message },
                });
            }

            for (const disposable of disposables) {
                try {
                    await disposable.close();
                } catch (err: any) {
                    PinoLogger.error({
                        scope: 'App',
                        message: 'Error closing disposable resource',
                        params: { message: err?.message },
                    });
                }
            }

            if (forceExitTimer) clearTimeout(forceExitTimer);
            exitProcess(serverCloseError ? 1 : 0);
        });
        forceExitTimer = setTimeout(() => exitProcess(1), 10_000);
        forceExitTimer.unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return shutdown;
}
