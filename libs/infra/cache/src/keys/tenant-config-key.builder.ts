import { Injectable } from "@nestjs/common";
import { Logger } from "@hl8/logger";
import { AbstractCacheKeyBuilder } from "./abstract-key.builder.js";

/**
 * @description 构建租户配置缓存键的载荷。
 */
export interface TenantConfigKeyPayload {
  /** @description 租户唯一标识 */
  tenantId: string;
  /** @description 配置项标识，默认使用 config */
  configKey?: string;
  /** @description 可选的版本或环境标签 */
  variant?: string;
}

const TENANT_CONFIG_NAMESPACE = "tenant-config";
const DEFAULT_CONFIG_KEY = "config";

/**
 * @description 租户配置缓存键生成器，统一租户数据的命名规则。
 */
@Injectable()
export class TenantConfigKeyBuilder extends AbstractCacheKeyBuilder<TenantConfigKeyPayload> {
  constructor(logger: Logger) {
    super(logger);
  }

  protected getNamespace(): string {
    return TENANT_CONFIG_NAMESPACE;
  }

  protected getKeyParts(
    payload: TenantConfigKeyPayload,
  ): Array<string | number> {
    const segments: Array<string | number> = [payload.tenantId];

    segments.push(payload.configKey ?? DEFAULT_CONFIG_KEY);

    if (payload.variant) {
      segments.push(payload.variant);
    }

    return segments;
  }
}
