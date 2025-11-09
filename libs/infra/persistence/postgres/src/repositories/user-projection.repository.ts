import { Injectable } from "@nestjs/common";
import { EntityManager } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Logger } from "@hl8/logger";
import {
  BaseTenantRepository,
  TenantContextExecutor,
} from "@hl8/multi-tenancy";
import type {
  UserProjection,
  UserProjectionRepository as UserProjectionRepositoryContract,
} from "@hl8/user";
import { UserProjectionEntity } from "../entities/user-projection.entity.js";

/**
 * @description 用户读模型仓储实现
 */
@Injectable()
export class UserProjectionRepository
  extends BaseTenantRepository<UserProjectionEntity>
  implements UserProjectionRepositoryContract
{
  constructor(
    @InjectEntityManager("postgres") entityManager: EntityManager,
    tenantContextExecutor: TenantContextExecutor,
    logger: Logger,
  ) {
    super(entityManager, UserProjectionEntity, tenantContextExecutor, logger);
  }

  public async upsert(projection: UserProjection): Promise<void> {
    const entity =
      (await this.findOne({ id: projection.id })) ?? new UserProjectionEntity();

    entity.id = projection.id;
    entity.tenantId = projection.tenantId;
    entity.displayName = projection.displayName;
    entity.email = projection.email;
    entity.roles = projection.roles;
    entity.status = projection.status;
    entity.createdAt = projection.createdAt;
    entity.updatedAt = projection.updatedAt;

    await this.getEntityManager().persistAndFlush(entity);
  }
}
