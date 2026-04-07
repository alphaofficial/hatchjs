import { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';

const noop: RequestHandler = (_req, _res, next) => next();

function bool(v: string | undefined): boolean {
	return v === 'true' || v === '1';
}

/**
 * Rate limiter for sensitive auth endpoints (/login, /register).
 *
 * Disabled by default. Enable with RATE_LIMIT_ENABLED=true.
 *
 *   RATE_LIMIT_AUTH_MAX (default 5)
 *   RATE_LIMIT_AUTH_WINDOW_MS (default 60000)
 *
 * Reads env at the moment the middleware is created (typically app boot).
 */
export function authRateLimit(): RequestHandler {
	if (!bool(process.env.RATE_LIMIT_ENABLED)) return noop;

	const max = Number(process.env.RATE_LIMIT_AUTH_MAX ?? 5);
	const windowMs = Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS ?? 60_000);

	return rateLimit({
		windowMs,
		max,
		standardHeaders: true,
		legacyHeaders: false,
		message: { error: 'Too many requests, please try again later.' },
	});
}
