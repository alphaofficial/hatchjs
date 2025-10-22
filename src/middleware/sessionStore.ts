import { Store } from 'express-session';
import { MikroORM } from '@mikro-orm/core';
import { Session } from '@/models/Session';

export class SessionStore extends Store {
  private orm: MikroORM;
  private requestStore = new Map<string, { ip?: string; userAgent?: string }>();

  constructor(orm: MikroORM) {
    super();
    this.orm = orm;
  }

  setRequestData(sessionId: string, ip: string, userAgent: string) {
    this.requestStore.set(sessionId, { ip, userAgent });
  }

  async get(sid: string, callback: (err: any, session?: any) => void) {
    try {
      const em = this.orm.em.fork();
      const session = await em.findOne(Session, { id: sid });

      if (!session || this.isExpired(session)) {
        return callback(null, null);
      }

      const data = JSON.parse(session.payload);
      callback(null, data);
    } catch (error) {
      callback(error);
    }
  }

  async set(sid: string, session: any, callback?: (err?: any) => void) {
    try {
      const em = this.orm.em.fork();
      const payload = JSON.stringify(session);
      const last_activity = Math.floor(Date.now() / 1000);
      const requestData = this.requestStore.get(sid);

      let sessionRecord = await em.findOne(Session, { id: sid });

      if (sessionRecord) {
        sessionRecord.payload = payload;
        sessionRecord.last_activity = last_activity;
        sessionRecord.user_id = session.userId || null;
      } else {
        sessionRecord = em.create(Session, {
          id: sid,
          payload,
          last_activity,
          user_id: session.userId || null,
          ip_address: requestData?.ip || null,
          user_agent: requestData?.userAgent || null
        });
      }

      await em.persistAndFlush(sessionRecord);
      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      const em = this.orm.em.fork();
      await em.nativeDelete(Session, { id: sid });
      this.requestStore.delete(sid);
      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }

  async touch(sid: string, _: any, callback?: (err?: any) => void) {
    try {
      const em = this.orm.em.fork();
      const last_activity = Math.floor(Date.now() / 1000);

      await em.nativeUpdate(Session, { id: sid }, { last_activity });
      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }

  private isExpired(session: Session): boolean {
    const now = Math.floor(Date.now() / 1000);
    const maxAge = 24 * 60 * 60; // 24 hours in seconds
    return (now - session.last_activity) > maxAge;
  }
}