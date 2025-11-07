import { Module } from "@nestjs/common";
import { CacheClientProvider } from "./services/cache-client.provider.js";
import { CacheMetricsHook } from "./monitoring/cache-metrics.hook.js";
import { CacheReadService } from "./services/cache-read.service.js";
import { TenantConfigKeyBuilder } from "./keys/tenant-config-key.builder.js";
import { CacheNamespaceRegistry } from "./config/cache-namespace.registry.js";
import { CacheNamespaceService } from "./services/cache-namespace.service.js";
import { CacheConsistencyService } from "./services/cache-consistency.service.js";
import { CacheConfig } from "./config/cache.config.js";

@Module({
  providers: [
    CacheClientProvider,
    CacheMetricsHook,
    CacheReadService,
    TenantConfigKeyBuilder,
    CacheNamespaceRegistry,
    CacheNamespaceService,
    CacheConsistencyService,
    CacheConfig,
  ],
  exports: [
    CacheClientProvider,
    CacheMetricsHook,
    CacheReadService,
    TenantConfigKeyBuilder,
    CacheNamespaceRegistry,
    CacheNamespaceService,
    CacheConsistencyService,
    CacheConfig,
  ],
})
export class CacheInfrastructureModule {}
