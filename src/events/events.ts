import { Emitter } from '@/primitives/events';
import type { EventMap } from '@/primitives/ports/events';
import { onUserLogin } from '@/events/handlers/onUserLogin';
import { onUserRegistered } from '@/events/handlers/onUserRegistered';
import { onUserVerified } from '@/events/handlers/onUserVerified';

export interface AppEvents extends EventMap {
    'user.registered': { id: string; email: string };
    'user.login': { id: string; email: string };
    'user.verified': { id: string; email: string };
}

export function registerAppEventHandlers(): void {
    Emitter.on<AppEvents, 'user.registered'>('user.registered', onUserRegistered);
    Emitter.on<AppEvents, 'user.login'>('user.login', onUserLogin);
    Emitter.on<AppEvents, 'user.verified'>('user.verified', onUserVerified);
}
