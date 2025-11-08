import { Global, Module } from "@nestjs/common";
import {
  CacheConfig,
  CACHE_REDLOCK_TOKEN,
  RedisClientConfig,
  RedisLockConfig,
} from "@hl8/cache";
import { Logger } from "@hl8/logger";
import {
  GeneralInternalServerException,
  MissingConfigurationForFeatureException,
} from "@hl8/exceptions";
import { REDIS_CLIENTS } from "@liaoliaots/nestjs-redis/dist/redis/redis.constants.js";
import type { RedisClients } from "@liaoliaots/nestjs-redis/dist/redis/interfaces/index.js";
import { Redis as RedisClient, type RedisOptions } from "ioredis";
import Redlock from "redlock";

const DEFAULT_CLIENT_KEY = "tenant-config-default";
const DEFAULT_NAMESPACE = "tenant-config";

/**
 * @description 构建缓存配置，读取环境变量并默认连接到 Docker 内的 Redis。
 */
function createCacheConfig(): CacheConfig {
  const config = new CacheConfig();
  const clientKey = process.env.CACHE_DEFAULT_CLIENT_KEY ?? DEFAULT_CLIENT_KEY;
  const namespace = process.env.CACHE_DEFAULT_NAMESPACE ?? DEFAULT_NAMESPACE;

  config.defaultClientKey = clientKey;
  config.readyLog = true;
  config.errorLog = true;

  const clientConfig = new RedisClientConfig();
  clientConfig.clientKey = clientKey;
  clientConfig.namespace = namespace;
  clientConfig.connectionName =
    process.env.CACHE_REDIS_CONNECTION_NAME ??
    `fastify-api:${namespace ?? clientKey}`;
  clientConfig.lazyConnect =
    process.env.CACHE_REDIS_LAZY_CONNECT === "true" ? true : false;
  clientConfig.db = Number(process.env.CACHE_REDIS_DB ?? "0");

  const redisUrl =
    process.env.CACHE_REDIS_URL ?? process.env.REDIS_URL ?? undefined;

  if (redisUrl) {
    clientConfig.url = redisUrl;
  } else {
    clientConfig.host =
      process.env.CACHE_REDIS_HOST ??
      process.env.REDIS_HOST ??
      "host.docker.internal";
    clientConfig.port = Number(
      process.env.CACHE_REDIS_PORT ?? process.env.REDIS_PORT ?? "6379",
    );
  }

  clientConfig.username =
    process.env.CACHE_REDIS_USERNAME ?? process.env.REDIS_USERNAME;
  clientConfig.password =
    process.env.CACHE_REDIS_PASSWORD ?? process.env.REDIS_PASSWORD;

  config.clients = [clientConfig];
  config.lock = config.lock ?? new RedisLockConfig();

  return config;
}

/**
 * @description 根据缓存配置创建 Redis 客户端映射，确保容器中的 Redis 已启动。
 */
async function createRedisClients(
  cacheConfig: CacheConfig,
  logger: Logger,
): Promise<RedisClients> {
  const clients = new Map<string, RedisClient>();
  const targetLogger =
    typeof logger.child === "function"
      ? logger.child({ context: "RedisClientsFactory" })
      : logger;

  const clientConfigs = cacheConfig.clients ?? [];
  if (clientConfigs.length === 0) {
    throw new MissingConfigurationForFeatureException(
      "缓存客户端",
      "cache.clients",
      "未配置任何 Redis 客户端，无法建立真实连接",
    );
  }

  for (const clientConfig of clientConfigs) {
    const clientKey =
      clientConfig.clientKey ??
      clientConfig.namespace ??
      cacheConfig.defaultClientKey ??
      DEFAULT_CLIENT_KEY;

    const redisOptions: RedisOptions = {
      host: clientConfig.host,
      port: clientConfig.port,
      username: clientConfig.username,
      password: clientConfig.password,
      db: clientConfig.db,
      name: clientConfig.connectionName,
      lazyConnect: clientConfig.lazyConnect,
      commandTimeout: clientConfig.commandTimeout,
      connectTimeout: clientConfig.connectTimeout,
      keepAlive: clientConfig.keepAlive,
      noDelay: clientConfig.noDelay,
      autoResubscribe: clientConfig.autoResubscribe,
      autoResendUnfulfilledCommands: clientConfig.autoResendUnfulfilledCommands,
      readOnly: clientConfig.readOnly,
      stringNumbers: clientConfig.stringNumbers,
      maxRetriesPerRequest: clientConfig.maxRetriesPerRequest ?? undefined,
      maxLoadingRetryTime: clientConfig.maxLoadingRetryTime,
      enableAutoPipelining: clientConfig.enableAutoPipelining,
      autoPipeliningIgnoredCommands: clientConfig.autoPipeliningIgnoredCommands,
      enableOfflineQueue: clientConfig.enableOfflineQueue,
      enableReadyCheck: clientConfig.enableReadyCheck,
    };

    const client = clientConfig.url
      ? new RedisClient(clientConfig.url, redisOptions)
      : new RedisClient(redisOptions);

    client.on("error", (error) => {
      targetLogger.error("Redis 客户端异常", undefined, {
        clientKey,
        error,
      });
    });

    try {
      await waitForRedisReady(client);
      targetLogger.log("Redis 客户端连接成功", {
        clientKey,
        host: client.options.host,
        port: client.options.port,
      });
      clients.set(clientKey, client);
    } catch (error) {
      throw new GeneralInternalServerException(
        "Redis 客户端连接失败，请确认 docker-compose 已启动并可访问",
        undefined,
        error as Error,
      );
    }
  }

  return clients;
}

/**
 * @description 基于现有 Redis 客户端实例化 Redlock，用于缓存一致性场景。
 */
function createRedlock(
  clients: RedisClients,
  cacheConfig: CacheConfig,
): Redlock {
  const redisClients = [...clients.values()];
  if (redisClients.length === 0) {
    throw new GeneralInternalServerException(
      "未检测到任何 Redis 客户端，无法初始化分布式锁",
    );
  }

  const lockConfig = cacheConfig.lock ?? new RedisLockConfig();
  return new Redlock(redisClients, {
    driftFactor: lockConfig.driftFactor,
    retryCount: lockConfig.retryCount,
    retryDelay: lockConfig.retryDelay,
    retryJitter: lockConfig.retryJitter,
    automaticExtensionThreshold: lockConfig.automaticExtensionThreshold,
  });
}

/**
 * @description 等待 Redis 客户端进入 ready 状态，兼容延迟连接与即时连接模式。
 * @param client Redis 客户端实例
 */
async function waitForRedisReady(client: RedisClient): Promise<void> {
  if (client.status === "ready") {
    return;
  }

  if (client.options.lazyConnect) {
    await client.connect();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const handleReady = () => {
      cleanup();
      resolve();
    };
    const handleError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      client.off("ready", handleReady);
      client.off("error", handleError);
    };

    client.once("ready", handleReady);
    client.once("error", handleError);
  });
}

@Global()
/**
 * @description 全局缓存基础设施引导模块，负责注入 Redis 客户端与分布式锁服务，保障业务模块直接复用真实 Redis 能力。
 */
@Module({
  providers: [
    {
      provide: CacheConfig,
      useFactory: createCacheConfig,
    },
    {
      provide: REDIS_CLIENTS,
      useFactory: createRedisClients,
      inject: [CacheConfig, Logger],
    },
    {
      provide: CACHE_REDLOCK_TOKEN,
      useFactory: createRedlock,
      inject: [REDIS_CLIENTS, CacheConfig],
    },
  ],
  exports: [CacheConfig, REDIS_CLIENTS, CACHE_REDLOCK_TOKEN],
})
export class CacheInfrastructureProviderModule {}
