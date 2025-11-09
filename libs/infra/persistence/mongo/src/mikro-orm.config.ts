import { Logger } from "@hl8/logger";
import type { Options } from "@mikro-orm/core";
import { defineConfig, MongoDriver } from "@mikro-orm/mongodb";

/**
 * @description MongoDB 连接配置选项
 */
export interface MongoConnectionOptions {
  /**
   * @description MongoDB 连接字符串，默认读取 `MONGO_URI`
   */
  uri?: string;
  /**
   * @description 默认数据库名称，未在 URI 中指定时生效
   */
  dbName?: string;
  /**
   * @description 是否启用调试日志
   */
  debug?: boolean;
  /**
   * @description 实体编译后路径
   */
  entities?: string[];
  /**
   * @description 实体 TS 源文件路径
   */
  entitiesTs?: string[];
}

/**
 * @description 根据环境变量与覆盖项生成 MongoDB MikroORM 配置
 * @param overrides 显式覆盖的配置项
 * @param logger 可选日志记录器
 * @returns MikroORM Options 配置
 */
export function createMongoMikroOrmConfig(
  overrides: MongoConnectionOptions = {},
  logger?: Logger,
): Options<MongoDriver> {
  const {
    uri = process.env.MONGO_URI ?? "mongodb://localhost:27017/hl8_platform",
    dbName = process.env.MONGO_DB ?? "hl8_platform",
    debug = process.env.MIKRO_ORM_MONGO_DEBUG === "true",
    entities = [],
    entitiesTs = [],
  } = overrides;

  if (logger) {
    logger.log("已载入 MongoDB 事件存储配置", {
      uri,
      dbName,
      debug,
    });
  }

  return defineConfig({
    driver: MongoDriver,
    clientUrl: uri,
    dbName,
    debug,
    entities,
    entitiesTs,
  });
}
