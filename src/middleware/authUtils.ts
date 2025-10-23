import { Request, NextFunction } from 'express';
import { User } from '../models/User';

export function injectAuthHelpers(req: Request, _: any, next: NextFunction) {
    req.user_id = (): string | null => {
        return (req.session as any)?.userId || null;
    };

    req.user = async (): Promise<User | null> => {
        if (!req.user_id()) return null;

        const em = req.orm.em;
        return em.findOne(User, { id:  req.user_id() }, {
            cache: 300000, // cache for 5 minutes
        });
    };

    req.is_authenticated = (): boolean => {
        return Boolean((req.session as any)?.userId);
    };

    req.is_guest = (): boolean => {
        return Boolean(!(req.session as any)?.userId);
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