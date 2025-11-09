import { Logger } from "@hl8/logger";
import type { Options } from "@mikro-orm/core";
import { defineConfig, PostgreSqlDriver } from "@mikro-orm/postgresql";

/**
 * @description PostgreSQL 连接配置选项
 */
export interface PostgresConnectionOptions {
  /**
   * @description 数据库主机地址，默认读取 `POSTGRES_HOST`
   */
  host?: string;
  /**
   * @description 数据库端口，默认读取 `POSTGRES_PORT`
   */
  port?: number;
  /**
   * @description 数据库名称，默认读取 `POSTGRES_DB`
   */
  dbName?: string;
  /**
   * @description 数据库用户名称，默认读取 `POSTGRES_USER`
   */
  user?: string;
  /**
   * @description 数据库密码，默认读取 `POSTGRES_PASSWORD`
   */
  password?: string;
  /**
   * @description 是否启用 MikroORM 调试日志
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
  /**
   * @description 迁移文件所在目录
   */
  migrationsPath?: string;
}

/**
 * @description 加载 PostgreSQL 连接配置，支持环境变量与显式覆盖
 * @param overrides 需要覆盖的配置项
 * @param logger 可选日志记录器，用于记录最终配置摘要
 * @returns MikroORM Options 配置对象
 */
export function createPostgresMikroOrmConfig(
  overrides: PostgresConnectionOptions = {},
  logger?: Logger,
): Options<PostgreSqlDriver> {
  const {
    host = process.env.POSTGRES_HOST ?? "localhost",
    port = Number(process.env.POSTGRES_PORT ?? 5432),
    dbName = process.env.POSTGRES_DB ?? "hl8_platform",
    user = process.env.POSTGRES_USER ?? "hl8_local",
    password = process.env.POSTGRES_PASSWORD ?? "hl8_local_pw",
    debug = process.env.MIKRO_ORM_DEBUG === "true",
    entities = [],
    entitiesTs = [],
    migrationsPath = "dist/migrations",
  } = overrides;

  if (logger) {
    logger.log("已载入 PostgreSQL 数据库配置", {
      host,
      port,
      dbName,
      user,
      debug,
    });
  }

  return defineConfig({
    driver: PostgreSqlDriver,
    host,
    port,
    dbName,
    user,
    password,
    debug,
    entities,
    entitiesTs,
    migrations: {
      path: migrationsPath,
      pathTs: migrationsPath.replace(/^dist/, "src"),
      glob: "!(*.d).{js,ts}",
    },
  });
}
