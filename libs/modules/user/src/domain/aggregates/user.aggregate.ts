import { UserDomainException } from "../exceptions/user-domain.exception.js";
import { DisplayName } from "../value-objects/display-name.vo.js";
import { EmailAddress } from "../value-objects/email-address.vo.js";
import { MobilePhone } from "../value-objects/mobile-phone.vo.js";
import { PlatformAdminId } from "../value-objects/platform-admin-id.vo.js";
import { TenantId } from "../value-objects/tenant-id.vo.js";
import { UserId } from "../value-objects/user-id.vo.js";
import { UserRole } from "../enums/user-role.enum.js";
import { UserStatus } from "../enums/user-status.enum.js";
import { UserCreatedDomainEvent } from "../events/user-created.domain-event.js";

interface UserProps {
  readonly id: UserId;
  readonly tenantId: TenantId;
  displayName: DisplayName;
  email: EmailAddress;
  mobile?: MobilePhone;
  status: UserStatus;
  roles: UserRole[];
  readonly createdBy: PlatformAdminId;
  readonly createdAt: Date;
}

/**
 * @description 用户聚合根，封装用户生命周期及不变式
 */
export class User {
  private readonly domainEvents: UserCreatedDomainEvent[] = [];

  private constructor(private readonly props: UserProps) {}

  /**
   * @description 创建用户聚合并记录领域事件
   * @param input 创建所需参数
   */
  public static create(input: {
    tenantId: TenantId;
    displayName: DisplayName;
    email: EmailAddress;
    mobile?: MobilePhone;
    roles: UserRole[];
    createdBy: PlatformAdminId;
  }): User {
    const roles = User.ensureRoles(input.roles ?? []);
    const user = new User({
      id: UserId.generate(),
      tenantId: input.tenantId,
      displayName: input.displayName,
      email: input.email,
      mobile: input.mobile,
      status: UserStatus.PendingActivation,
      roles,
      createdBy: input.createdBy,
      createdAt: new Date(),
    });

    user.recordEvent(
      UserCreatedDomainEvent.create(
        user.id,
        user.tenantId,
        user.createdBy,
        user.createdAt,
      ),
    );

    return user;
  }

  /**
   * @description 设置角色集合
   * @param roles 新的角色集合
   */
  public assignRoles(roles: UserRole[]): void {
    this.props.roles = User.ensureRoles(roles ?? []);
  }

  /**
   * @description 提取领域事件并清空事件队列
   */
  public pullDomainEvents(): UserCreatedDomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }

  private recordEvent(event: UserCreatedDomainEvent): void {
    this.domainEvents.push(event);
  }

  private static ensureRoles(roles: UserRole[]): UserRole[] {
    const uniqueRoles = Array.from(new Set(roles));
    if (uniqueRoles.length === 0) {
      throw new UserDomainException("至少需要分配一个用户角色");
    }
    return uniqueRoles;
  }

  public get id(): UserId {
    return this.props.id;
  }

  public get tenantId(): TenantId {
    return this.props.tenantId;
  }

  public get displayName(): DisplayName {
    return this.props.displayName;
  }

  public get email(): EmailAddress {
    return this.props.email;
  }

  public get mobile(): MobilePhone | undefined {
    return this.props.mobile;
  }

  public get status(): UserStatus {
    return this.props.status;
  }

  public get roles(): UserRole[] {
    return [...this.props.roles];
  }

  public get createdBy(): PlatformAdminId {
    return this.props.createdBy;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }
}
