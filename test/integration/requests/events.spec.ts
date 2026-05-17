import { registerAppEventHandlers } from '@/events/events';
import type { AppEvents } from '@/events/events';
import { NodeEventDriver } from '@/events/drivers/node';
import { Emitter } from '@/primitives/events';
import type { EventEngine } from '@/primitives/ports/events';
import { Queue } from '@/primitives/queue';
import { PinoLogger } from '@/logger/pinoLogger';

describe('event bus', () => {
    afterEach(() => {
        Emitter.reset();
        Queue.reset();
        jest.restoreAllMocks();
    });

    it('emits and receives user.registered', (done) => {
        const payload: AppEvents['user.registered'] = { id: '1', email: 'a@b.com' };
        Emitter.on<AppEvents, 'user.registered'>('user.registered', (data) => {
            expect(data).toEqual(payload);
            done();
        });
        Emitter.emit<AppEvents, 'user.registered'>('user.registered', payload);
    });

    it('emits and receives user.login', (done) => {
        const payload: AppEvents['user.login'] = { id: '2', email: 'login@test.com' };
        Emitter.on<AppEvents, 'user.login'>('user.login', (data) => {
            expect(data).toEqual(payload);
            done();
        });
        Emitter.emit<AppEvents, 'user.login'>('user.login', payload);
    });

    it('emits and receives user.verified', (done) => {
        const payload: AppEvents['user.verified'] = { id: '3', email: 'verify@test.com' };
        Emitter.on<AppEvents, 'user.verified'>('user.verified', (data) => {
            expect(data).toEqual(payload);
            done();
        });
        Emitter.emit<AppEvents, 'user.verified'>('user.verified', payload);
    });

    it('does not call removed listener', () => {
        const calls: unknown[] = [];
        const listener = (data: AppEvents['user.registered']) => calls.push(data);
        Emitter.on<AppEvents, 'user.registered'>('user.registered', listener);
        Emitter.off<AppEvents, 'user.registered'>('user.registered', listener);
        Emitter.emit<AppEvents, 'user.registered'>('user.registered', { id: '1', email: 'a@b.com' });
        expect(calls).toHaveLength(0);
    });

    it('supports multiple listeners for the same event', () => {
        const results: string[] = [];
        Emitter.on<AppEvents, 'user.login'>('user.login', () => results.push('first'));
        Emitter.on<AppEvents, 'user.login'>('user.login', () => results.push('second'));
        Emitter.emit<AppEvents, 'user.login'>('user.login', { id: '1', email: 'x@x.com' });
        expect(results).toEqual(['first', 'second']);
    });

    it('delegates operations to an injected event engine', () => {
        const calls: string[] = [];
        const listener = jest.fn();
        const engine: EventEngine<AppEvents> = {
            emit: (event) => { calls.push(`emit:${String(event)}`); return true; },
            on: (event) => { calls.push(`on:${String(event)}`); },
            off: (event) => { calls.push(`off:${String(event)}`); },
            removeAllListeners: (event) => { calls.push(`remove:${String(event)}`); },
        };

        Emitter.setDriver(engine);
        Emitter.on<AppEvents, 'user.registered'>('user.registered', listener);
        Emitter.emit<AppEvents, 'user.registered'>('user.registered', { id: '1', email: 'a@b.com' });
        Emitter.off<AppEvents, 'user.registered'>('user.registered', listener);
        Emitter.removeAllListeners<AppEvents>('user.registered');

        expect(calls).toEqual([
            'on:user.registered',
            'emit:user.registered',
            'off:user.registered',
            'remove:user.registered',
        ]);
    });

    it('removeAllListeners clears all registered driver listeners', () => {
        const calls: string[] = [];
        Emitter.on<AppEvents, 'user.registered'>('user.registered', () => calls.push('registered'));
        Emitter.on<AppEvents, 'user.login'>('user.login', () => calls.push('login'));

        Emitter.removeAllListeners<AppEvents>();
        Emitter.emit<AppEvents, 'user.registered'>('user.registered', { id: '1', email: 'a@b.com' });
        Emitter.emit<AppEvents, 'user.login'>('user.login', { id: '2', email: 'login@test.com' });

        expect(calls).toEqual([]);
    });

    it('removeAllListeners(event) clears only one registered driver event', () => {
        const calls: string[] = [];
        Emitter.on<AppEvents, 'user.registered'>('user.registered', () => calls.push('registered'));
        Emitter.on<AppEvents, 'user.login'>('user.login', () => calls.push('login'));

        Emitter.removeAllListeners<AppEvents>('user.registered');
        Emitter.emit<AppEvents, 'user.registered'>('user.registered', { id: '1', email: 'a@b.com' });
        Emitter.emit<AppEvents, 'user.login'>('user.login', { id: '2', email: 'login@test.com' });

        expect(calls).toEqual(['login']);
    });

    it('registers handlers for each app event', () => {
        const calls: string[] = [];
        const engine: EventEngine<AppEvents> = {
            emit: () => true,
            on: (event) => { calls.push(`on:${String(event)}`); },
            off: () => {},
            removeAllListeners: () => {},
        };

        Emitter.setDriver(engine);

        registerAppEventHandlers();

        expect(calls).toEqual([
            'on:user.registered',
            'on:user.login',
            'on:user.verified',
        ]);
    });

    it('handles user.registered without dispatching duplicate welcome email jobs', () => {
        const dispatch = jest.fn().mockResolvedValue(undefined);
        const info = jest.spyOn(PinoLogger, 'info').mockImplementation(() => undefined);

        Emitter.setDriver(new NodeEventDriver());
        Queue.setDriver({ dispatch });

        registerAppEventHandlers();
        Emitter.emit<AppEvents, 'user.registered'>('user.registered', { id: '1', email: 'welcome@example.com' });

        expect(dispatch).not.toHaveBeenCalled();
        expect(info).toHaveBeenCalledWith({
            scope: 'events',
            message: 'Handled user.registered event',
            params: { userId: '1', email: 'welcome@example.com' },
        });
    });

    it('does not export an AppEmitter wrapper', async () => {
        const eventsModule = await import('@/events/events');
        expect(eventsModule).not.toHaveProperty('AppEmitter');
    });
});
