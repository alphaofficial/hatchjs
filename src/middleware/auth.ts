import { Request, Response, NextFunction } from 'express';

export function auth(req: Request, res: Response, next: NextFunction) {
    if (req.is_authenticated()) {
        next();
    } else {
        return res.redirect('/login');
    }
}

export function guest(req: Request, res: Response, next: NextFunction) {
    if (req.is_authenticated()) {
        return res.redirect('/dashboard');
    } else {
        next();
    }
}