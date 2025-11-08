import { Injectable } from "@nestjs/common";

/**
 * @description 租户配置实体结构。
 */
export interface TenantConfigurationRecord {
  tenantId: string;
  displayName: string;
  updatedAt: string;
  version: number;
}

/**
 * @description 数据源接口，定义租户配置的回源加载方式。
 */
export interface TenantConfigurationDataSource {
  fetchTenantConfiguration(
    tenantId: string,
  ): Promise<TenantConfigurationRecord>;
}

export const TENANT_CONFIG_DATA_SOURCE = Symbol("TENANT_CONFIG_DATA_SOURCE");

/**
 * @description 默认的内存数据源，适用于本地开发或测试场景。
 */
@Injectable()
export class InMemoryTenantConfigurationDataSource
  implements TenantConfigurationDataSource
{
  private readonly store = new Map<string, TenantConfigurationRecord>();

  async fetchTenantConfiguration(
    tenantId: string,
  ): Promise<TenantConfigurationRecord> {
    if (!this.store.has(tenantId)) {
      this.store.set(tenantId, {
        tenantId,
        displayName: `租户 ${tenantId}`,
        updatedAt: new Date().toISOString(),
        version: 1,
      });
    }

    return this.store.get(tenantId)!;
  }
}
