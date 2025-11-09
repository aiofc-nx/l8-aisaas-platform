import { Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { Logger } from "@hl8/logger";
import { TenantContextExecutor } from "@hl8/multi-tenancy";
import { RefreshCommand } from "../commands/refresh.command.js";
import type { RefreshResult } from "../services/refresh.service.js";

/**
 * @description 刷新令牌用例，执行刷新命令并维护 CLS 上下文
 */
@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly tenantContextExecutor: TenantContextExecutor,
    private readonly logger: Logger,
  ) {}

  public async execute(input: {
    refreshToken: string;
  }): Promise<RefreshResult> {
    this.logger.log("开始执行刷新令牌用例", {});

    const command = new RefreshCommand(input.refreshToken);
    const result = await this.commandBus.execute<RefreshCommand, RefreshResult>(
      command,
    );

    await this.tenantContextExecutor.runWithTenantContext(
      result.tenantId,
      async () => {
        this.logger.log("刷新用例已写入租户上下文", {
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
