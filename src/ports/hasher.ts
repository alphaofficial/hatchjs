export interface Hasher {
    make(value: string): Promise<string>;
    check(value: string, hashedValue: string): Promise<boolean>;
}