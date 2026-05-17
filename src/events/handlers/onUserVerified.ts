import { PinoLogger } from '@/logger/pinoLogger';
import type { AppEvents } from '@/events/events';

export function onUserVerified(payload: AppEvents['user.verified']): void {
    PinoLogger.info({
        scope: 'events',
        message: 'Handled user.verified event',
        params: { userId: payload.id, email: payload.email },
    });
}
