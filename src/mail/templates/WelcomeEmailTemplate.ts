export interface WelcomeEmailTemplateData {
    name: string;
    appName?: string;
}

export function WelcomeEmailTemplate({ name, appName = 'The Boring Architecture' }: WelcomeEmailTemplateData): string {
    return `
        <h1>Welcome to ${appName}, ${name}!</h1>
        <p>We're glad to have you on board.</p>
        <p>Get started by exploring the app at your own pace.</p>
        <p>If you have any questions, feel free to reach out.</p>
        <p>— The ${appName} Team</p>
    `;
}
