import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@hl8/logger";
import { RefreshCommand } from "../commands/refresh.command.js";
import { RefreshService } from "../services/refresh.service.js";
import type { RefreshResult } from "../services/refresh.service.js";
import { TenantContextExecutor } from "@hl8/multi-tenancy";

/**
 * @description 刷新令牌命令处理器，负责令牌轮换与事件发布
 */
@CommandHandler(RefreshCommand)
export class RefreshCommandHandler implements ICommandHandler<RefreshCommand> {
  constructor(
    private readonly refreshService: RefreshService,
    private readonly eventBus: EventBus,
    private readonly tenantContextExecutor: TenantContextExecutor,
    private readonly logger: Logger,
  ) {}

  public async execute(command: RefreshCommand): Promise<RefreshResult> {
    this.logger.log("开始处理刷新令牌命令", {});

    const result = await this.refreshService.execute(command);

    await this.tenantContextExecutor.runWithTenantContext(
      result.tenantId,
      async () => {
        this.logger.log("刷新令牌命令已写入租户上下文", {
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
