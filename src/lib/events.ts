import { EventEmitter } from 'node:events';

export interface AppEvents {
    'user.registered': { id: string; email: string };
    'user.login': { id: string; email: string };
    'user.verified': { id: string; email: string };
}

class TypedEmitter extends EventEmitter {
    emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]): boolean {
        return super.emit(event as string, payload);
    }

    on<K extends keyof AppEvents>(event: K, listener: (payload: AppEvents[K]) => void): this {
        return super.on(event as string, listener);
    }

    off<K extends keyof AppEvents>(event: K, listener: (payload: AppEvents[K]) => void): this {
        return super.off(event as string, listener);
    }
}

const instance = new TypedEmitter();

export class Emitter {
    static emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]): boolean {
        return instance.emit(event, payload);
    }

    static on<K extends keyof AppEvents>(event: K, listener: (payload: AppEvents[K]) => void): void {
        instance.on(event, listener);
    }

    static off<K extends keyof AppEvents>(event: K, listener: (payload: AppEvents[K]) => void): void {
        instance.off(event, listener);
    }

    static removeAllListeners(event?: keyof AppEvents): void {
        if (event === undefined) {
            instance.removeAllListeners();
        } else {
            instance.removeAllListeners(event as string);
        }
    }
}
