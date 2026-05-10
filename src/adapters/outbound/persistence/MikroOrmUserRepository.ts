import { MikroORM, RequestContext, type EntityManager } from '@mikro-orm/core';
import type {
    UserRepository,
    UserRepositoryEntity,
    UserRepositoryEntityClass,
} from '@/ports/user-repository';

export class MikroOrmUserRepository implements UserRepository {
    constructor(private readonly orm: MikroORM) {}

    private getEntityManager(): EntityManager {
        return RequestContext.getEntityManager() ?? this.orm.em;
    }

    async findOne<T extends UserRepositoryEntity>(
        entity: UserRepositoryEntityClass<T>,
        where: Partial<T>,
    ): Promise<T | null> {
        return this.getEntityManager().findOne(entity, where as never);
    }

    async persistAndFlush<T extends UserRepositoryEntity>(entity: T): Promise<void> {
        await this.getEntityManager().persistAndFlush(entity);
    }

    create<T extends UserRepositoryEntity>(
        entity: UserRepositoryEntityClass<T>,
        data: Partial<T>,
    ): T {
        return this.getEntityManager().create(entity, data as never);
    }

    async nativeDelete<T extends UserRepositoryEntity>(
        entity: UserRepositoryEntityClass<T>,
        where: Partial<T>,
    ): Promise<number> {
        return this.getEntityManager().nativeDelete(entity, where as never);
    }

    async flush(): Promise<void> {
        await this.getEntityManager().flush();
    }
}
