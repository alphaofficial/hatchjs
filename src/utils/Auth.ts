import { RequestContext } from '@mikro-orm/core';
import { User } from '../models/User';

export class Auth {
    static async user(userId?: string): Promise<User | null> {
        if (!userId) return null;
        
        const em = RequestContext.getEntityManager();
        if (!em) return null;
        
        return em.findOne(User, { id: userId });
    }

    static check(userId?: string): boolean {
        return !!userId;
    }

    static guest(userId?: string): boolean {
        return !userId;
    }

    static id(userId?: string): string | null {
        return userId || null;
    }
}