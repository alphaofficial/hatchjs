import { PinoLogger } from '../logger/pinoLogger';

interface SendWelcomeEmailPayload {
	to: string;
	name?: string;
}

export async function sendWelcomeEmail(payload: unknown): Promise<void> {
	const { to, name } = payload as SendWelcomeEmailPayload;
	PinoLogger.info({
		scope: 'job:sendWelcomeEmail',
		message: `Sending welcome email to ${to}`,
		params: { to, name },
	});
}
