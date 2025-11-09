import { SessionId } from "./session-id.vo.js";
import { UserId, TenantId } from "@hl8/user";

/**
 * @description 刷新令牌载荷值对象
 */
export class RefreshTokenPayload {
  constructor(
    public readonly sessionId: SessionId,
    public readonly userId: UserId,
    public readonly tenantId: TenantId,
    public readonly issuedAt: Date = new Date(),
  ) {}

  public toJSON(): Record<string, unknown> {
    return {
      sid: this.sessionId.value,
      uid: this.userId.value,
      tid: this.tenantId.value,
      iat: Math.floor(this.issuedAt.getTime() / 1000),
    };
  }
}
