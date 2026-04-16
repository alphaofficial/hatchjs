import { Emitter, AppEvents } from '@/lib/events';

describe('event bus', () => {
    afterEach(() => {
        Emitter.removeAllListeners();
    });

    it('emits and receives user.registered', (done) => {
        const payload: AppEvents['user.registered'] = { id: '1', email: 'a@b.com' };
        Emitter.on('user.registered', (data) => {
            expect(data).toEqual(payload);
            done();
        });
        Emitter.emit('user.registered', payload);
    });

    it('emits and receives user.login', (done) => {
        const payload: AppEvents['user.login'] = { id: '2', email: 'login@test.com' };
        Emitter.on('user.login', (data) => {
            expect(data).toEqual(payload);
            done();
        });
        Emitter.emit('user.login', payload);
    });

    it('emits and receives user.verified', (done) => {
        const payload: AppEvents['user.verified'] = { id: '3', email: 'verify@test.com' };
        Emitter.on('user.verified', (data) => {
            expect(data).toEqual(payload);
            done();
        });
        Emitter.emit('user.verified', payload);
    });

    it('does not call removed listener', () => {
        const calls: unknown[] = [];
        const listener = (data: AppEvents['user.registered']) => calls.push(data);
        Emitter.on('user.registered', listener);
        Emitter.off('user.registered', listener);
        Emitter.emit('user.registered', { id: '1', email: 'a@b.com' });
        expect(calls).toHaveLength(0);
    });

    it('supports multiple listeners for the same event', () => {
        const results: string[] = [];
        Emitter.on('user.login', () => results.push('first'));
        Emitter.on('user.login', () => results.push('second'));
        Emitter.emit('user.login', { id: '1', email: 'x@x.com' });
        expect(results).toEqual(['first', 'second']);
    });
});
