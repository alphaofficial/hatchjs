import type { AppEvents } from '@/events/events';
import { PinoLogger } from '@/logger/pinoLogger';

export function onUserRegistered(payload: AppEvents['user.registered']): void {
    PinoLogger.info({
        scope: 'events',
        message: 'Handled user.registered event',
        params: { userId: payload.id, email: payload.email },
    });
}
