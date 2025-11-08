import { SessionId } from "./session-id.vo.js";
import { UserId, TenantId } from "@hl8/user";

/**
 * @description 访问令牌载荷值对象
 */
export class AccessTokenPayload {
  constructor(
    public readonly sessionId: SessionId,
    public readonly userId: UserId,
    public readonly tenantId: TenantId,
    public readonly roles: string[],
    public readonly permissions: string[],
    public readonly issuedAt: Date = new Date(),
  ) {}

  public toJSON(): Record<string, unknown> {
    return {
      sid: this.sessionId.value,
      uid: this.userId.value,
      tid: this.tenantId.value,
      roles: this.roles,
      permissions: this.permissions,
      iat: Math.floor(this.issuedAt.getTime() / 1000),
    };
  }
}
