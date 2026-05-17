export type EventMap = Record<string, unknown>;

export interface EventEngine<Events extends EventMap = EventMap> {
    emit<K extends keyof Events & string>(event: K, payload: Events[K]): boolean;
    on<K extends keyof Events & string>(event: K, listener: (payload: Events[K]) => void): void;
    off<K extends keyof Events & string>(event: K, listener: (payload: Events[K]) => void): void;
    removeAllListeners(event?: keyof Events & string): void;
}

export type EventDriver<Events extends EventMap = EventMap> = EventEngine<Events>;
