import { Module } from "@nestjs/common";
import { CacheClientProvider } from "./services/cache-client.provider.js";
import { CacheMetricsHook } from "./monitoring/cache-metrics.hook.js";
import { CacheReadService } from "./services/cache-read.service.js";
import { TenantConfigKeyBuilder } from "./keys/tenant-config-key.builder.js";

@Module({
  providers: [
    CacheClientProvider,
    CacheMetricsHook,
    CacheReadService,
    TenantConfigKeyBuilder,
  ],
  exports: [
    CacheClientProvider,
    CacheMetricsHook,
    CacheReadService,
    TenantConfigKeyBuilder,
  ],
})
export class CacheInfrastructureModule {}
