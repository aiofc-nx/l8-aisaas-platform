import { PlatformAdminId } from "../value-objects/platform-admin-id.vo.js";
import { TenantId } from "../value-objects/tenant-id.vo.js";
import { UserId } from "../value-objects/user-id.vo.js";

/**
 * @description 用户创建领域事件，用于通知下游流程（审计、激活等）
 */
export class UserCreatedDomainEvent {
  private constructor(
    public readonly userId: UserId,
    public readonly tenantId: TenantId,
    public readonly createdBy: PlatformAdminId,
    public readonly occurredAt: Date,
  ) {}

  /**
   * @description 创建用户创建事件
   * @param userId 新用户标识
   * @param tenantId 所属租户标识
   * @param createdBy 操作管理员标识
   * @param occurredAt 事件时间（默认当前时间）
   */
  public static create(
    userId: UserId,
    tenantId: TenantId,
    createdBy: PlatformAdminId,
    occurredAt: Date = new Date(),
  ): UserCreatedDomainEvent {
    return new UserCreatedDomainEvent(userId, tenantId, createdBy, occurredAt);
  }

  /**
   * @description 序列化 Domain Event，便于记录或消息分发
   */
  public toJSON(): Record<string, unknown> {
    return {
      userId: this.userId.value,
      tenantId: this.tenantId.value,
      createdBy: this.createdBy.value,
      occurredAt: this.occurredAt.toISOString(),
    };
  }
}
