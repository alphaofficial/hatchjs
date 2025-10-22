import { Request, NextFunction } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { User } from '../models/User';

export function injectAuthUtilities(req: Request, _: any, next: NextFunction) {
    // Add Laravel-style auth utilities to request
    req.user = async (): Promise<User | null> => {
        const userId = req.user_id();
        if (!userId) return null;
        
        const em = RequestContext.getEntityManager();
        if (!em) return null;
        
        return em.findOne(User, { id: userId });
    };

    req.user_id = (): string | null => {
        return (req.session as any)?.userId || null;
    };

    req.is_authenticated = (): boolean => {
        return !!(req.session as any)?.userId;
    };

    req.is_guest = (): boolean => {
        return !(req.session as any)?.userId;
    };

    req.authenticate = (user: User): void => {
        (req.session as any).userId = user.id;
    };

    req.logout = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            req.session.destroy((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    };

    next();
}