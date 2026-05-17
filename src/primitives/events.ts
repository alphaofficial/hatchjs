import type { EventDriver, EventEngine, EventMap } from '@/primitives/ports/events';

export type { EventDriver, EventEngine, EventMap } from '@/primitives/ports/events';

export interface TypedEmitter<Events extends EventMap> {
    setDriver(driver: EventDriver<Events>): void;
    reset(): void;
    emit<K extends keyof Events & string>(event: K, payload: Events[K]): boolean;
    on<K extends keyof Events & string>(event: K, listener: (payload: Events[K]) => void): void;
    off<K extends keyof Events & string>(event: K, listener: (payload: Events[K]) => void): void;
    removeAllListeners(event?: keyof Events & string): void;
}

let registeredDriver: EventDriver | null = null;
let activeDriver: EventDriver | null = null;

export class Emitter {
    static setDriver<Events extends EventMap>(driver: EventDriver<Events>): void {
        registeredDriver = driver;
        activeDriver = driver;
    }

    static reset(): void {
        registeredDriver?.removeAllListeners();
        activeDriver = registeredDriver;
    }

    static emit<Events extends EventMap, K extends keyof Events & string>(event: K, payload: Events[K]): boolean {
        return this.getActiveEngine<Events>().emit(event, payload);
    }

    static on<Events extends EventMap, K extends keyof Events & string>(event: K, listener: (payload: Events[K]) => void): void {
        this.getActiveEngine<Events>().on(event, listener);
    }

    static off<Events extends EventMap, K extends keyof Events & string>(event: K, listener: (payload: Events[K]) => void): void {
        this.getActiveEngine<Events>().off(event, listener);
    }

    static removeAllListeners<Events extends EventMap>(event?: keyof Events & string): void {
        this.getActiveEngine<Events>().removeAllListeners(event);
    }

    private static getActiveDriver<Events extends EventMap>(): EventDriver<Events> {
        if (!activeDriver) {
            throw new Error('Event driver is not registered');
        }
        return activeDriver as EventDriver<Events>;
    }

    private static getActiveEngine<Events extends EventMap>(): EventEngine<Events> {
        return this.getActiveDriver<Events>();
    }
}
