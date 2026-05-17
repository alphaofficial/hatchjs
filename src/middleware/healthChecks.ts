import type { Express } from 'express';

export function useHealthChecks(app: Express): void {
    app.get('/healthz', (_req, res) => {
        res.status(200).json({ status: 'ok' });
    });

    app.get('/readyz', async (req, res) => {
        try {
            await req.orm.em.getConnection().execute('select 1');
            res.status(200).json({ status: 'ready' });
        } catch {
            res.status(503).json({ status: 'not_ready' });
        }
    });
}
