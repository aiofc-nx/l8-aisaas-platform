import { Module } from "@nestjs/common";
import { CacheInfrastructureModule } from "@hl8/cache";
import {
  InMemoryTenantConfigurationDataSource,
  TENANT_CONFIG_DATA_SOURCE,
} from "./tenant-config.types.js";
import { TenantConfigService } from "./tenant-config.service.js";
import { TenantConfigController } from "./tenant-config.controller.js";

/**
 * @description 租户配置模块，整合缓存基础设施与默认数据源。
 */
@Module({
  imports: [CacheInfrastructureModule],
  controllers: [TenantConfigController],
  providers: [
    TenantConfigService,
    {
      provide: TENANT_CONFIG_DATA_SOURCE,
      useClass: InMemoryTenantConfigurationDataSource,
    },
  ],
  exports: [TenantConfigService],
})
export class TenantConfigModule {}
