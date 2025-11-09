import { Injectable } from "@nestjs/common";
import { Logger } from "@hl8/logger";
import type { TokenPayloadBuilder } from "../../interfaces/token-payload-builder.js";
import type { SessionId } from "../../domain/value-objects/session-id.vo.js";
import type { UserId, TenantId } from "@hl8/user";
import { AccessTokenPayload } from "../../domain/value-objects/access-token-payload.vo.js";
import { RefreshTokenPayload } from "../../domain/value-objects/refresh-token-payload.vo.js";

/**
 * @description Token Payload 构造服务，负责统一封装访问/刷新令牌负载结构
 */
@Injectable()
export class TokenBuilderService implements TokenPayloadBuilder {
  constructor(private readonly logger: Logger) {}

  public buildAccessPayload(input: {
    sessionId: SessionId;
    userId: UserId;
    tenantId: TenantId;
    roles: string[];
    permissions: string[];
  }): AccessTokenPayload {
    this.logger.log("正在构造访问令牌负载", {
      sessionId: input.sessionId.value,
      tenantId: input.tenantId.value,
      userId: input.userId.value,
    });

    return new AccessTokenPayload(
      input.sessionId,
      input.userId,
      input.tenantId,
      input.roles,
      input.permissions,
    );
  }

  public buildRefreshPayload(input: {
    sessionId: SessionId;
    userId: UserId;
    tenantId: TenantId;
  }): RefreshTokenPayload {
    this.logger.log("正在构造刷新令牌负载", {
      sessionId: input.sessionId.value,
      tenantId: input.tenantId.value,
      userId: input.userId.value,
    });

    return new RefreshTokenPayload(
      input.sessionId,
      input.userId,
      input.tenantId,
    );
  }
}
