import type { Logger } from "@hl8/logger";

/**
 * @description 应用服务日志基类，统一注入 @hl8/logger
 */
export abstract class UserLoggingBase {
  protected constructor(protected readonly logger: Logger) {}
}
