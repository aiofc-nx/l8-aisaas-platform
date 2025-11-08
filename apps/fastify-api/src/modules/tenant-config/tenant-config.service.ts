import { Inject, Injectable } from "@nestjs/common";
import {
  CacheReadService,
  TenantConfigKeyBuilder,
  TENANT_CONFIG_CACHE_DOMAIN,
  TENANT_CONFIG_CACHE_TTL_SECONDS,
} from "@hl8/cache";
import { GeneralBadRequestException } from "@hl8/exceptions";
import { ClsService } from "nestjs-cls";
import {
  TENANT_CONFIG_DATA_SOURCE,
  type TenantConfigurationDataSource,
  type TenantConfigurationRecord,
} from "./tenant-config.types.js";

const CLS_TENANT_CACHE_CONTEXT = "cache.tenantConfig";

/**
 * @description 提供租户配置的缓存读写能力，默认在 5 分钟内保持缓存命中，并将缓存上下文写入 CLS 供链路追踪使用。
 */
@Injectable()
export class TenantConfigService {
  constructor(
    private readonly cacheReadService: CacheReadService,
    private readonly tenantConfigKeyBuilder: TenantConfigKeyBuilder,
    @Inject(TENANT_CONFIG_DATA_SOURCE)
    private readonly dataSource: TenantConfigurationDataSource,
    private readonly clsService: ClsService,
  ) {}

  /**
   * @description 获取租户配置，优先命中缓存，缓存缺失时回源加载，并记录缓存上下文。
   * @param tenantId 租户唯一标识
   * @returns 租户配置数据，包含展示名、更新时间和版本号
   * @throws GeneralBadRequestException 当传入的租户编号为空时抛出
   */
  async getTenantConfiguration(
    tenantId: string,
  ): Promise<TenantConfigurationRecord> {
    const normalizedTenantId = tenantId?.trim();
    if (!normalizedTenantId) {
      throw new GeneralBadRequestException({
        field: "tenantId",
        message: "租户编号不能为空",
        rejectedValue: tenantId,
      });
    }

    const cacheKey = this.tenantConfigKeyBuilder.build({
      tenantId: normalizedTenantId,
    });

    this.clsService.set(CLS_TENANT_CACHE_CONTEXT, {
      tenantId: normalizedTenantId,
      cacheKey,
      domain: TENANT_CONFIG_CACHE_DOMAIN,
      ttlSeconds: TENANT_CONFIG_CACHE_TTL_SECONDS,
    });

    return this.cacheReadService.getOrLoad<TenantConfigurationRecord>({
      domain: TENANT_CONFIG_CACHE_DOMAIN,
      key: cacheKey,
      tenantId: normalizedTenantId,
      ttlSeconds: TENANT_CONFIG_CACHE_TTL_SECONDS,
      loader: () =>
        this.dataSource.fetchTenantConfiguration(normalizedTenantId),
    });
  }
}
