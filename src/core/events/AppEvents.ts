export interface AppEvents {
    'user.registered': { id: string; email: string };
    'user.login': { id: string; email: string };
    'user.verified': { id: string; email: string };
}
