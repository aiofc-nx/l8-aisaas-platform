import {
  AuthSession,
  SessionId,
  AccessToken,
  RefreshToken,
  AuthSessionStatus,
} from "@hl8/auth";
import { UserId, TenantId } from "@hl8/user";
import { AuthSessionEntity } from "../entities/auth-session.entity.js";

/**
 * @description AuthSession 聚合与 MikroORM 实体之间的映射器
 */
export class AuthSessionOrmMapper {
  public static toDomain(entity: AuthSessionEntity): AuthSession {
    return AuthSession.restore({
      sessionId: SessionId.fromString(entity.id),
      userId: UserId.fromString(entity.userId),
      tenantId: TenantId.fromString(entity.tenantId),
      accessToken: AccessToken.create(
        entity.accessToken,
        entity.accessTokenExpiresAt,
      ),
      refreshToken: RefreshToken.create(
        entity.refreshToken,
        entity.refreshTokenExpiresAt,
      ),
      issuedAt: entity.issuedAt,
      lastRefreshedAt: entity.lastRefreshedAt ?? null,
      status: entity.status,
      roles: entity.roles,
      permissions: entity.permissions,
    });
  }

  public static toPersistence(session: AuthSession): AuthSessionEntity {
    const entity = new AuthSessionEntity();
    entity.id = session.sessionId.value;
    entity.tenantId = session.tenantId.value;
    entity.userId = session.userId.value;
    entity.accessToken = session.accessToken.value;
    entity.accessTokenExpiresAt = session.accessToken.expiresAt;
    entity.refreshToken = session.refreshToken.value;
    entity.refreshTokenExpiresAt = session.refreshToken.expiresAt;
    entity.status = session.status as AuthSessionStatus;
    entity.issuedAt = session.issuedAt;
    entity.lastRefreshedAt = session.lastRefreshedAt ?? null;
    entity.roles = session.roles;
    entity.permissions = session.permissions;
    entity.createdAt = session.issuedAt;
    entity.updatedAt = session.lastRefreshedAt ?? session.issuedAt;
    return entity;
  }
}
