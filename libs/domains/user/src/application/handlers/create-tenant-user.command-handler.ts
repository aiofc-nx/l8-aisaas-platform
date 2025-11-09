import { CommandHandler, type ICommandHandler, EventBus } from "@nestjs/cqrs";
import { Logger } from "@hl8/logger";
import { TenantContextExecutor } from "@hl8/multi-tenancy";
import { GeneralForbiddenException } from "@hl8/exceptions";
import { CreateTenantUserCommand } from "../commands/create-tenant-user.command.js";
import { CreateTenantUserService } from "../services/create-tenant-user.service.js";
import type { CreateTenantUserResult } from "../services/create-tenant-user.service.js";

/**
 * @description 处理创建租户用户命令，负责执行业务服务与事件发布
 */
@CommandHandler(CreateTenantUserCommand)
export class CreateTenantUserCommandHandler
  implements ICommandHandler<CreateTenantUserCommand, CreateTenantUserResult>
{
  constructor(
    private readonly service: CreateTenantUserService,
    private readonly tenantContextExecutor: TenantContextExecutor,
    private readonly eventBus: EventBus,
    private readonly logger: Logger,
  ) {}

  public async execute(
    command: CreateTenantUserCommand,
  ): Promise<CreateTenantUserResult> {
    const contextTenantId = this.tenantContextExecutor.getTenantIdOrFail();
    if (contextTenantId !== command.tenantId) {
      this.logger.error("检测到跨租户创建用户尝试", undefined, {
        contextTenantId,
        commandTenantId: command.tenantId,
      });
      throw new GeneralForbiddenException("禁止跨租户访问");
    }

    const result = await this.service.execute(command);

    for (const event of result.events) {
      this.eventBus.publish(event);
    }

    return result;
  }
}
