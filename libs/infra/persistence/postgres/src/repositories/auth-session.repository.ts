import { Injectable } from "@nestjs/common";
import { EntityManager } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import {
  AuthSession,
  AuthSessionRepository as AuthSessionRepositoryContract,
  AuthSessionStatus,
  SessionId,
} from "@hl8/auth";
import { Logger } from "@hl8/logger";
import {
  BaseTenantRepository,
  TenantContextExecutor,
} from "@hl8/multi-tenancy";
import { GeneralForbiddenException } from "@hl8/exceptions";
import { AuthSessionEntity } from "../entities/auth-session.entity.js";
import { AuthSessionOrmMapper } from "../mappers/auth-session.orm-mapper.js";

/**
 * @description AuthSession 仓储的 MikroORM 实现
 */
@Injectable()
export class MikroOrmAuthSessionRepository
  extends BaseTenantRepository<AuthSessionEntity>
  implements AuthSessionRepositoryContract
{
  constructor(
    @InjectEntityManager("postgres") entityManager: EntityManager,
    tenantContextExecutor: TenantContextExecutor,
    logger: Logger,
  ) {
    super(entityManager, AuthSessionEntity, tenantContextExecutor, logger);
  }

  public async save(session: AuthSession): Promise<void> {
    const tenantId = this.tenantContextExecutor.getTenantIdOrFail();
    if (tenantId !== session.tenantId.value) {
      this.logger.error(
        "会话保存时检测到跨租户数据，已阻止写入",
        undefined,
        {
          contextTenantId: tenantId,
          sessionTenantId: session.tenantId.value,
        },
      );
      throw new GeneralForbiddenException("禁止跨租户写入会话数据");
    }

    const existing = await this.findOne({ id: session.sessionId.value });
    if (existing) {
      existing.accessToken = session.accessToken.value;
      existing.accessTokenExpiresAt = session.accessToken.expiresAt;
      existing.refreshToken = session.refreshToken.value;
      existing.refreshTokenExpiresAt = session.refreshToken.expiresAt;
      existing.status = session.status as AuthSessionStatus;
      existing.issuedAt = session.issuedAt;
      existing.lastRefreshedAt = session.lastRefreshedAt ?? null;
      existing.roles = session.roles;
      existing.permissions = session.permissions;
      existing.updatedAt = new Date();
    } else {
      const entity = AuthSessionOrmMapper.toPersistence(session);
      this.em.persist(entity);
    }

    await this.em.flush();
  }

  public async findBySessionId(
    sessionId: SessionId,
  ): Promise<AuthSession | null> {
    const entity = await this.findOne({ id: sessionId.value });
    if (!entity) {
      return null;
    }
    return AuthSessionOrmMapper.toDomain(entity);
  }

  public async findByRefreshToken(token: string): Promise<AuthSession | null> {
    const entity = await this.findOne({ refreshToken: token });
    if (!entity) {
      return null;
    }
    return AuthSessionOrmMapper.toDomain(entity);
  }

  public async revoke(sessionId: SessionId): Promise<void> {
    await this.nativeUpdate(
      { id: sessionId.value },
      { status: AuthSessionStatus.Revoked },
    );
  }
}
