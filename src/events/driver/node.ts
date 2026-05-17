import { EventEmitter } from 'node:events';
import type { EventDriver, EventMap } from '@/primitives/ports/events';

export class NodeEventDriver<Events extends EventMap = EventMap> implements EventDriver<Events> {
    private readonly emitter = new EventEmitter();

    emit<K extends keyof Events & string>(event: K, payload: Events[K]): boolean {
        return this.emitter.emit(event as string, payload);
    }

    on<K extends keyof Events & string>(event: K, listener: (payload: Events[K]) => void): void {
        this.emitter.on(event as string, listener);
    }

    off<K extends keyof Events & string>(event: K, listener: (payload: Events[K]) => void): void {
        this.emitter.off(event as string, listener);
    }

    removeAllListeners(event?: keyof Events & string): void {
        if (event === undefined) {
            this.emitter.removeAllListeners();
            return;
        }
        this.emitter.removeAllListeners(event as string);
    }
}
