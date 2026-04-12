import { emitter, HatchEvents } from '@/lib/events';

describe('event bus', () => {
    afterEach(() => {
        emitter.removeAllListeners();
    });

    it('emits and receives user.registered', (done) => {
        const payload: HatchEvents['user.registered'] = { id: '1', email: 'a@b.com' };
        emitter.on('user.registered', (data) => {
            expect(data).toEqual(payload);
            done();
        });
        emitter.emit('user.registered', payload);
    });

    it('emits and receives user.login', (done) => {
        const payload: HatchEvents['user.login'] = { id: '2', email: 'login@test.com' };
        emitter.on('user.login', (data) => {
            expect(data).toEqual(payload);
            done();
        });
        emitter.emit('user.login', payload);
    });

    it('emits and receives user.verified', (done) => {
        const payload: HatchEvents['user.verified'] = { id: '3', email: 'verify@test.com' };
        emitter.on('user.verified', (data) => {
            expect(data).toEqual(payload);
            done();
        });
        emitter.emit('user.verified', payload);
    });

    it('does not call removed listener', () => {
        const calls: unknown[] = [];
        const listener = (data: HatchEvents['user.registered']) => calls.push(data);
        emitter.on('user.registered', listener);
        emitter.off('user.registered', listener);
        emitter.emit('user.registered', { id: '1', email: 'a@b.com' });
        expect(calls).toHaveLength(0);
    });

    it('supports multiple listeners for the same event', () => {
        const results: string[] = [];
        emitter.on('user.login', () => results.push('first'));
        emitter.on('user.login', () => results.push('second'));
        emitter.emit('user.login', { id: '1', email: 'x@x.com' });
        expect(results).toEqual(['first', 'second']);
    });
});
