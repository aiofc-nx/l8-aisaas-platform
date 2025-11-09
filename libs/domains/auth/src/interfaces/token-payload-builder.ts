import type { SessionId } from "../domain/value-objects/session-id.vo.js";
import type { UserId, TenantId } from "@hl8/user";
import { AccessTokenPayload } from "../domain/value-objects/access-token-payload.vo.js";
import { RefreshTokenPayload } from "../domain/value-objects/refresh-token-payload.vo.js";

/**
 * @description Token Payload 构造器接口，负责根据上下文生成 AccessToken/RefreshToken 的负载
 */
export interface TokenPayloadBuilder {
  /**
   * @description 构造访问令牌负载
   */
  buildAccessPayload(input: {
    sessionId: SessionId;
    userId: UserId;
    tenantId: TenantId;
    roles: string[];
    permissions: string[];
  }): AccessTokenPayload;

  /**
   * @description 构造刷新令牌负载
   */
  buildRefreshPayload(input: {
    sessionId: SessionId;
    userId: UserId;
    tenantId: TenantId;
  }): RefreshTokenPayload;
}
