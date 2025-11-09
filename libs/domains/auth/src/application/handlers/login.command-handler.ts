import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@hl8/logger";
import { LoginCommand } from "../commands/login.command.js";
import { LoginService } from "../services/login.service.js";
import type { LoginResult } from "../services/login.service.js";
import { TenantContextExecutor } from "@hl8/multi-tenancy";

/**
 * @description 登录命令处理器，负责执行业务逻辑并发布领域事件
 */
@CommandHandler(LoginCommand)
export class LoginCommandHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly loginService: LoginService,
    private readonly eventBus: EventBus,
    private readonly tenantContextExecutor: TenantContextExecutor,
    private readonly logger: Logger,
  ) {}

  public async execute(command: LoginCommand): Promise<LoginResult> {
    this.logger.log("开始处理登录命令", {
      email: command.email,
    });

    const result = await this.loginService.execute(command);

    await this.tenantContextExecutor.runWithTenantContext(
      result.tenantId,
      async () => {
        this.logger.log("登录命令已写入租户上下文", {
          tenantId: result.tenantId,
          userId: result.userId,
        });

        if (result.events?.length) {
          for (const event of result.events) {
            this.eventBus.publish(event);
          }
        }
      },
      {
        userId: result.userId,
      },
    );

    return result;
  }
}
