import type { IEvent } from "@nestjs/cqrs";
import { PlatformAdminId } from "../value-objects/platform-admin-id.vo.js";
import { TenantId } from "../value-objects/tenant-id.vo.js";
import { UserId } from "../value-objects/user-id.vo.js";
import { DisplayName } from "../value-objects/display-name.vo.js";
import { EmailAddress } from "../value-objects/email-address.vo.js";
import { UserStatus } from "../enums/user-status.enum.js";
import { UserRole } from "../enums/user-role.enum.js";

/**
 * @description 用户创建领域事件，用于通知下游流程（审计、激活等）
 */
export class UserCreatedDomainEvent implements IEvent {
  private constructor(
    public readonly userId: UserId,
    public readonly tenantId: TenantId,
    public readonly createdBy: PlatformAdminId,
    public readonly displayName: DisplayName,
    public readonly email: EmailAddress,
    public readonly status: UserStatus,
    public readonly roles: UserRole[],
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
    displayName: DisplayName,
    email: EmailAddress,
    status: UserStatus,
    roles: UserRole[],
    occurredAt: Date = new Date(),
  ): UserCreatedDomainEvent {
    return new UserCreatedDomainEvent(
      userId,
      tenantId,
      createdBy,
      displayName,
      email,
      status,
      roles,
      occurredAt,
    );
  }

  /**
   * @description 序列化 Domain Event，便于记录或消息分发
   */
  public toJSON(): Record<string, unknown> {
    return {
      userId: this.userId.value,
      tenantId: this.tenantId.value,
      createdBy: this.createdBy.value,
      displayName: this.displayName.value,
      email: this.email.value,
      status: this.status,
      roles: this.roles,
      occurredAt: this.occurredAt.toISOString(),
    };
  }
}
