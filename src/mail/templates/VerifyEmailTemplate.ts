export interface VerifyEmailTemplateData {
    verifyUrl: string;
    appName?: string;
    intro?: string;
}

export function VerifyEmailTemplate({
    verifyUrl,
    appName = 'The Boring Architecture',
    intro,
}: VerifyEmailTemplateData): string {
    const lead = intro ?? `Welcome to ${appName}!`;

    return `
        <p>${lead}</p>
        <p><a href="${verifyUrl}">Click here to verify your email address</a></p>
        <p>If you did not create an account, please ignore this email.</p>
    `;
}
