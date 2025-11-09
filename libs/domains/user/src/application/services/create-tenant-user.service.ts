import type { Logger } from "@hl8/logger";
import { CreateTenantUserCommand } from "../commands/create-tenant-user.command.js";
import { UserRepository } from "../../interfaces/user.repository.js";
import { UserLoggingBase } from "./user-logging.base.js";
import { EmailAddress } from "../../domain/value-objects/email-address.vo.js";
import { DisplayName } from "../../domain/value-objects/display-name.vo.js";
import { MobilePhone } from "../../domain/value-objects/mobile-phone.vo.js";
import { TenantId } from "../../domain/value-objects/tenant-id.vo.js";
import { PlatformAdminId } from "../../domain/value-objects/platform-admin-id.vo.js";
import { User } from "../../domain/aggregates/user.aggregate.js";
import { UserRole } from "../../domain/enums/user-role.enum.js";
import { EmailAlreadyExistsException } from "../../domain/exceptions/email-already-exists.exception.js";
import { UserCreatedDomainEvent } from "../../domain/events/user-created.domain-event.js";
import { UserDomainException } from "../../domain/exceptions/user-domain.exception.js";

export interface CreateTenantUserResult {
  user: User;
  events: UserCreatedDomainEvent[];
}

/**
 * @description 创建租户用户应用服务
 */
export class CreateTenantUserService extends UserLoggingBase {
  constructor(
    private readonly userRepository: UserRepository,
    logger: Logger,
  ) {
    super(logger);
  }

  /**
   * @description 执行创建用户流程
   * @param command 创建用户命令
   */
  public async execute(
    command: CreateTenantUserCommand,
  ): Promise<CreateTenantUserResult> {
    const tenantId = TenantId.fromString(command.tenantId);
    const createdBy = PlatformAdminId.fromString(command.createdBy);
    const displayName = DisplayName.create(command.displayName);
    const email = EmailAddress.create(command.email);
    const mobile = MobilePhone.fromNullable(command.mobile ?? undefined);
    const roles = this.resolveRoles(command.roles);

    const duplicated = await this.userRepository.findByEmail(email);
    if (duplicated) {
      this.logger.warn("尝试创建重复邮箱的用户", {
        tenantId: tenantId.value,
        email: email.value,
      });
      throw new EmailAlreadyExistsException(email.value);
    }

    const user = User.create({
      tenantId,
      displayName,
      email,
      mobile,
      roles,
      createdBy,
    });

    await this.userRepository.save(user);

    const events = user.pullDomainEvents();
    this.logger.log("用户创建成功", {
      tenantId: tenantId.value,
      userId: user.id.value,
      email: email.value,
    });

    return { user, events };
  }

  private resolveRoles(rawRoles?: string[] | null): UserRole[] {
    const roles =
      rawRoles && rawRoles.length > 0 ? rawRoles : [UserRole.TenantAdmin];
    return roles.map((role) => {
      if (role === UserRole.TenantAdmin) {
        return UserRole.TenantAdmin;
      }
      throw new UserDomainException(`不支持的用户角色：${role}`);
    });
  }
}
