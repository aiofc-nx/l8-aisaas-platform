import type { Logger } from "@hl8/logger";
import { CommandBus } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { CreateTenantUserCommand } from "../commands/create-tenant-user.command.js";
import type { CreateTenantUserResult } from "../services/create-tenant-user.service.js";

/**
 * @description 应用层用例：为指定租户创建用户
 * @remarks
 * - Clean Architecture 中用例负责编排应用服务与命令总线；
 * - 该用例不会直接依赖基础设施层，所有调用通过命令、仓储接口完成；
 * - 日志、异常等由调用者决定是否处理。
 */
@Injectable()
export class CreateTenantUserUseCase {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: Logger,
  ) {}

  /**
   * @description 执行创建租户用户用例
   * @param input 用例输入参数
   */
  public async execute(input: {
    tenantId: string;
    createdBy: string;
    displayName: string;
    email: string;
    mobile?: string | null;
    roles?: string[];
  }): Promise<CreateTenantUserResult> {
    this.logger.log("开始执行创建租户用户用例", {
      tenantId: input.tenantId,
      email: input.email,
    });

    const command = new CreateTenantUserCommand(
      input.tenantId,
      input.createdBy,
      input.displayName,
      input.email,
      input.mobile,
      input.roles,
    );

    const result = (await this.commandBus.execute<
      CreateTenantUserCommand,
      CreateTenantUserResult
    >(command)) ?? {
      user: undefined,
      events: [],
    };

    this.logger.log("创建租户用户用例执行完成", {
      tenantId: input.tenantId,
      email: input.email,
    });

    return result;
  }
}
