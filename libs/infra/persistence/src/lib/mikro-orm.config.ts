import { Logger } from "@hl8/logger";
import { createPostgresMikroOrmConfig } from "@hl8/persistence-postgres";
import { createMongoMikroOrmConfig } from "@hl8/persistence-mongo";
import type { Options } from "@mikro-orm/core";
import type { PostgreSqlDriver } from "@mikro-orm/postgresql";
import type { MongoDriver } from "@mikro-orm/mongodb";

/**
 * @description PostgreSQL + MongoDB 多数据源配置封装
 */
export interface MultiMikroOrmConfig {
  /**
   * @description PostgreSQL 数据源配置
   */
  postgres: Options<PostgreSqlDriver>;
  /**
   * @description MongoDB 数据源配置
   */
  mongo: Options<MongoDriver>;
}

/**
 * @description 构建 PostgreSQL 与 MongoDB 的 MikroORM Options，并挂载租户订阅器
 * @param logger 用于记录配置摘要的日志器
 * @returns 多数据源配置对象
 */
export function createMultiMikroOrmConfig(logger: Logger): MultiMikroOrmConfig {
  logger.log("正在加载 MikroORM 多数据源配置");

  const postgresOptions = createPostgresMikroOrmConfig(
    {
      debug: process.env.MIKRO_ORM_DEBUG === "true",
    },
    logger,
  );

  logger.log("PostgreSQL 配置加载完成", {
    entities: postgresOptions.entities,
    dbName: postgresOptions.dbName,
    host: postgresOptions.host,
    port: postgresOptions.port,
  });

  const mongoOptions = createMongoMikroOrmConfig(
    {
      debug: process.env.MIKRO_ORM_DEBUG === "true",
    },
    logger,
  );

  logger.log("MongoDB 配置加载完成", {
    dbName: mongoOptions.dbName,
    clientUrl: mongoOptions.clientUrl,
  });

  return {
    postgres: postgresOptions as Options<PostgreSqlDriver>,
    mongo: mongoOptions as Options<MongoDriver>,
  };
}
