import { Inject, Injectable } from "@nestjs/common";
import { Logger } from "@hl8/logger";
import {
  GeneralInternalServerException,
  MissingConfigurationForFeatureException,
} from "@hl8/exceptions";
import { REDIS_CLIENTS } from "@liaoliaots/nestjs-redis/dist/redis/redis.constants.js";
import type { RedisClients } from "@liaoliaots/nestjs-redis/dist/redis/interfaces/index.js";
import type { Redis } from "ioredis";
import { CacheConfig } from "../config/cache.config.js";

type LoggerWithChild = Logger & {
  child?: (context: Record<string, unknown>) => Logger;
};

/**
 * @description 提供 Redis 客户端访问封装，统一处理命名空间与错误。
 */
@Injectable()
export class CacheClientProvider {
  private readonly logger: Logger;

  constructor(
    @Inject(REDIS_CLIENTS)
    private readonly redisClients: RedisClients,
    private readonly cacheConfig: CacheConfig,
    logger: Logger,
  ) {
    if (typeof (logger as LoggerWithChild).child === "function") {
      this.logger = (logger as LoggerWithChild).child({
        context: CacheClientProvider.name,
      });
    } else {
      this.logger = logger;
    }
  }

  /**
   * @description 根据 clientKey 获取 Redis 客户端，未指定时使用默认客户端。
   * @param clientKey - 指定的客户端键名
   */
  public getClient(clientKey?: string): Redis {
    const targetKey = this.resolveTargetClientKey(clientKey);

    try {
      const client = this.redisClients.get(targetKey);
      if (!client) {
        const context = {
          clientKey: targetKey,
        };
        this.logger.error("缓存客户端获取失败", undefined, context);
        throw new MissingConfigurationForFeatureException(
          "缓存客户端",
          targetKey,
          `未找到名称为 ${targetKey} 的缓存客户端，请检查配置`,
        );
      }
      return client;
    } catch (error) {
      if (error instanceof MissingConfigurationForFeatureException) {
        throw error;
      }

      const context = {
        clientKey: targetKey,
        error,
      };
      this.logger.error("获取 Redis 客户端实例时发生异常", undefined, context);
      throw new GeneralInternalServerException(
        "读取缓存客户端失败，请联系运维人员",
        undefined,
        error,
      );
    }
  }

  /**
   * @description 返回默认的命名空间前缀，用于组合缓存键。
   */
  public getNamespacePrefix(clientKey?: string): string | undefined {
    const targetKey = this.resolveTargetClientKey(clientKey);
    const clientConfig = this.cacheConfig.clients.find((item) => {
      const key = item.clientKey ?? item.namespace;
      return key === targetKey;
    });

    return clientConfig?.namespace;
  }

  private resolveTargetClientKey(clientKey?: string): string {
    if (clientKey && clientKey.trim().length > 0) {
      return clientKey;
    }

    if (this.cacheConfig.defaultClientKey) {
      return this.cacheConfig.defaultClientKey;
    }

    const iterator = this.redisClients.keys();
    const firstKey = iterator.next().value as string | undefined;
    if (!firstKey) {
      throw new MissingConfigurationForFeatureException(
        "缓存客户端",
        "cache.clients",
        "Redis 客户端尚未注册，请确保 setupRedisModule 已执行",
      );
    }
    return firstKey;
  }
}
