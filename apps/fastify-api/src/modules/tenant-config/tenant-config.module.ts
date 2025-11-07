import { Module } from "@nestjs/common";
import {
  CacheConfig,
  CacheInfrastructureModule,
  RedisClientConfig,
} from "@hl8/cache";
import { REDIS_CLIENTS } from "@liaoliaots/nestjs-redis/dist/redis/redis.constants.js";
import type { RedisClients } from "@liaoliaots/nestjs-redis/dist/redis/interfaces/index.js";
import type { Redis } from "ioredis";
import {
  InMemoryTenantConfigurationDataSource,
  TENANT_CONFIG_DATA_SOURCE,
} from "./tenant-config.types.js";
import { TenantConfigService } from "./tenant-config.service.js";
import { TenantConfigController } from "./tenant-config.controller.js";

const DEFAULT_REDIS_CLIENT_KEY = "tenant-config-default";

function createInMemoryRedisClients(): RedisClients {
  const store = new Map<string, string>();
  const timers = new Map<string, NodeJS.Timeout>();

  const client: Partial<Redis> = {
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async set(
      key: string,
      value: string,
      ...args: Array<unknown>
    ): Promise<"OK"> {
      store.set(key, value);

      const [mode, ttl] = args;
      if (mode === "EX" && typeof ttl === "number" && ttl > 0) {
        const existingTimer = timers.get(key);
        if (existingTimer) {
          clearTimeout(existingTimer);
          existingTimer.unref?.();
          timers.delete(key);
        }

        const timeout = setTimeout(() => {
          store.delete(key);
          timers.delete(key);
        }, ttl * 1000);

        timeout.unref?.();
        timers.set(key, timeout);
      }

      return "OK";
    },
  };

  const clients: RedisClients = new Map();
  clients.set(DEFAULT_REDIS_CLIENT_KEY, client as Redis);
  return clients;
}

function createDefaultCacheConfig(): CacheConfig {
  const cacheConfig = new CacheConfig();
  cacheConfig.readyLog = false;
  cacheConfig.errorLog = false;
  cacheConfig.defaultClientKey = DEFAULT_REDIS_CLIENT_KEY;

  const clientConfig = new RedisClientConfig();
  clientConfig.clientKey = DEFAULT_REDIS_CLIENT_KEY;
  clientConfig.namespace = "tenant-config";
  clientConfig.lazyConnect = true;

  cacheConfig.clients = [clientConfig];
  return cacheConfig;
}

/**
 * @description 租户配置模块，整合缓存基础设施与默认数据源。
 */
@Module({
  imports: [CacheInfrastructureModule],
  controllers: [TenantConfigController],
  providers: [
    TenantConfigService,
    {
      provide: REDIS_CLIENTS,
      useFactory: createInMemoryRedisClients,
    },
    {
      provide: CacheConfig,
      useFactory: createDefaultCacheConfig,
    },
    {
      provide: TENANT_CONFIG_DATA_SOURCE,
      useClass: InMemoryTenantConfigurationDataSource,
    },
  ],
  exports: [TenantConfigService],
})
export class TenantConfigModule {}
