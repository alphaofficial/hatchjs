import { LogTransport } from '@/adapters/outbound/mail/log';
import { PinoLogger } from '@/adapters/shared/logger/pinoLogger';

describe('log transport adapter', () => {
    it('logs the outgoing mail payload through PinoLogger', async () => {
        const infoSpy = jest.spyOn(PinoLogger, 'info').mockImplementation(() => undefined);
        const transport = new LogTransport();

        await transport.sendMail({
            to: 'user@example.com',
            subject: 'Welcome',
            html: '<p>Hello</p>',
            from: 'noreply@example.com',
        });

        expect(infoSpy).toHaveBeenCalledWith({
            scope: 'mail',
            message: '[LOG DRIVER] To: user@example.com | Subject: Welcome',
            params: { html: '<p>Hello</p>' },
        });

        infoSpy.mockRestore();
    });
});
