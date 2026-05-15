import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export class Hash {
    static async make(value: string): Promise<string> {
        return bcrypt.hash(value, SALT_ROUNDS);
    }

    static async check(value: string, hashedValue: string): Promise<boolean> {
        return bcrypt.compare(value, hashedValue);
    }
}