import { WelcomeEmailTemplate } from '@/mail/templates/WelcomeEmailTemplate';
import { Mailer } from '@/primitives/mail';

interface SendWelcomeEmailPayload {
    to: string;
    name?: string;
}

function parsePayload(payload: unknown): SendWelcomeEmailPayload {
    if (!payload || typeof payload !== 'object' || !('to' in payload) || typeof payload.to !== 'string' || payload.to.trim() === '') {
        throw new Error('sendWelcomeEmailJob requires payload.to');
    }

    const name = 'name' in payload && typeof payload.name === 'string'
        ? payload.name
        : undefined;

    return {
        to: payload.to,
        name,
    };
}

export async function sendWelcomeEmailJob(payload: unknown): Promise<void> {
    const data = parsePayload(payload);
    const name = data.name?.trim() || data.to;
    const html = WelcomeEmailTemplate({ name });

    await Mailer.send(data.to, 'Welcome to The Boring Architecture', html);
}
