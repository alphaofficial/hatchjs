import type { PasswordReset } from '@/core/models/PasswordReset';
import type { Session } from '@/core/models/Session';
import type { User } from '@/core/models/User';

export type UserRepositoryEntity = User | PasswordReset | Session;

export type UserRepositoryEntityClass<T extends UserRepositoryEntity> = abstract new (...args: any[]) => T;

export interface UserRepository {
    findOne<T extends UserRepositoryEntity>(
        entity: UserRepositoryEntityClass<T>,
        where: Partial<T>
    ): Promise<T | null>;
    persistAndFlush<T extends UserRepositoryEntity>(entity: T): Promise<void>;
    create<T extends UserRepositoryEntity>(
        entity: UserRepositoryEntityClass<T>,
        data: Partial<T>
    ): T;
    nativeDelete<T extends UserRepositoryEntity>(
        entity: UserRepositoryEntityClass<T>,
        where: Partial<T>
    ): Promise<number>;
    flush(): Promise<void>;
}
