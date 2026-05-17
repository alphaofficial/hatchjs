import session from 'express-session';
import type { RequestHandler } from 'express';
import { MikroORM } from '@mikro-orm/core';
import variables from '@/config/variables';
import { generateSessionToken, SessionStore } from '@/primitives/sessionStore';

export function trackSessionRequestData(sessionStore: SessionStore): RequestHandler {
    return (req, _, next) => {
        if (req.sessionID) {
            sessionStore.setRequestData(
                req.sessionID,
                req.ip || '',
                req.get('User-Agent') || '',
            );
        }
        next();
    };
}

export function createSessionMiddleware(orm: MikroORM): RequestHandler[] {
    const sessionStore = new SessionStore(orm);

    return [
        trackSessionRequestData(sessionStore),
        session({
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
            },
        }),
    ];
}
