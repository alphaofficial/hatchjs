export interface ResetPasswordTemplateData {
    resetUrl: string;
    expiryMinutes: number;
}

export function ResetPasswordTemplate({ resetUrl, expiryMinutes }: ResetPasswordTemplateData): string {
    return `
        <p>You requested a password reset for your account.</p>
        <p><a href="${resetUrl}">Click here to reset your password</a></p>
        <p>This link expires in ${expiryMinutes} minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
    `;
}
