import { Injectable } from "@nestjs/common";
import { EntityManager } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import type { EmailAddress, User } from "@hl8/user";
import { UserRepository as UserRepositoryContract } from "@hl8/user";
import { Logger } from "@hl8/logger";
import {
  TenantContextExecutor,
  BaseTenantRepository,
} from "@hl8/multi-tenancy";
import { UserEntity } from "../entities/user.entity.js";
import { UserOrmMapper } from "../mappers/user.orm-mapper.js";

/**
 * @description 使用 MikroORM 的 PostgreSQL 用户仓储实现
 */
@Injectable()
export class MikroOrmUserRepository
  extends BaseTenantRepository<UserEntity>
  implements UserRepositoryContract
{
  constructor(
    @InjectEntityManager("postgres") entityManager: EntityManager,
    tenantContextExecutor: TenantContextExecutor,
    logger: Logger,
  ) {
    super(entityManager, UserEntity, tenantContextExecutor, logger);
  }

  public async findByEmail(email: EmailAddress): Promise<User | null> {
    const entity = await this.findOne({ email: email.value });
    if (!entity) {
      return null;
    }
    return UserOrmMapper.toDomain(entity);
  }

  public async save(user: User): Promise<void> {
    const existing = await this.findOne({ id: user.id.value });
    if (existing) {
      this.em.assign(existing, UserOrmMapper.toPersistence(user));
      await this.em.flush();
      return;
    }

    const entity = UserOrmMapper.toPersistence(user);
    this.em.persist(entity);
    await this.em.flush();
  }
}
