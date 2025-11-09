import { Logger } from "@hl8/logger";

/**
 * @description 认证模块服务基类，注入项目统一日志组件
 */
export abstract class AuthLoggingService {
  protected constructor(protected readonly logger: Logger) {}
}
