import { PinoLogger } from '@/logger/pinoLogger';
import type { AppEvents } from '@/events/events';

export function onUserLogin(payload: AppEvents['user.login']): void {
    PinoLogger.info({
        scope: 'events',
        message: 'Handled user.login event',
        params: { userId: payload.id, email: payload.email },
    });
}
