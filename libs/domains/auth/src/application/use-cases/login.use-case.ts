import { Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { Logger } from "@hl8/logger";
import { TenantContextExecutor } from "@hl8/multi-tenancy";
import { LoginCommand } from "../commands/login.command.js";
import type { LoginResult } from "../services/login.service.js";

/**
 * @description 平台管理员登录用例，负责封装登录流程与 CLS 写入
 */
@Injectable()
export class LoginUseCase {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly tenantContextExecutor: TenantContextExecutor,
    private readonly logger: Logger,
  ) {}

  public async execute(input: {
    email: string;
    password: string;
  }): Promise<LoginResult> {
    this.logger.log("开始执行平台管理员登录用例", {
      email: input.email,
    });

    const command = new LoginCommand(input.email, input.password);
    const result = await this.commandBus.execute<LoginCommand, LoginResult>(
      command,
    );

    await this.tenantContextExecutor.runWithTenantContext(
      result.tenantId,
      async () => {
        this.logger.log("登录用例已写入租户上下文", {
          tenantId: result.tenantId,
          userId: result.userId,
        });
      },
      {
        userId: result.userId,
      },
    );

    return result;
  }
}
