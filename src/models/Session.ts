export class Session {
    id!: string;
    user_id?: string;
    ip_address?: string;
    user_agent?: string;
    payload!: string;
    last_activity!: number;
}