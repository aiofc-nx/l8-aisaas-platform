import { createFastifyLoggerConfig } from "@hl8/logger";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module.js";
import { bootstrap } from "./bootstrap.js";
import { setupSwagger } from "./swagger.js";

/**
 * @description 应用启动入口：负责创建 Fastify 适配器、初始化 NestJS 应用并接入 @hl8/logger
 * @returns Promise<void> 应用启动完成后返回
 * @throws Error 当创建应用或启动过程发生异常时抛出错误
 * @example
 * ```typescript
 * main().catch((error) => {
 *   console.error("启动失败", error);
 *   process.exit(1);
 * });
 * ```
 */
const main = async (): Promise<void> => {
  try {
    console.log("[Main] 开始初始化应用...");
    // 注意：在模块创建之前，无法使用 AppConfig 注入配置
    // 这里使用 process.env 作为初始化配置，实际配置会在模块创建后通过 AppConfig 统一管理
    // 这些值会被配置文件和环境变量覆盖（通过 dotenvLoader）
    const nodeEnv = process.env.NODE_ENV || "development";
    const logLevel =
      process.env.LOG_LEVEL || process.env.LOGGING__LEVEL || "info";
    const isDevelopment = nodeEnv === "development";

    console.log("[Main] 创建 Fastify 适配器...");
    const adapter = new FastifyAdapter({
      logger: (() => {
        if (isDevelopment) {
          return createFastifyLoggerConfig({
            level: logLevel,
            prettyPrint: true,
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          });
        }

        return createFastifyLoggerConfig({
          level: logLevel,
          prettyPrint: false,
        });
      })(),
      trustProxy: true,
    });

    console.log("[Main] 创建 NestJS 应用实例...");
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      adapter,
      {
        // 禁用 NestJS 内置日志，使用 PinoLoggingModule 的日志
        logger: false,
      },
    ).catch((error) => {
      console.error("[Main] NestFactory.create 失败:", error);
      throw error;
    });

    // 启用关闭钩子，确保在应用关闭时正确清理资源
    app.enableShutdownHooks();

    console.log("[Main] 设置 Swagger API 文档...");
    // 设置 Swagger API 文档
    await setupSwagger(app);

    console.log("[Main] 启动应用...");
    await bootstrap(app);
    console.log("[Main] 应用启动完成");
  } catch (error) {
    console.error("[Main] 应用启动过程中发生错误:", error);
    throw error;
  }
};

/**
 * @description 执行应用启动逻辑并捕获顶层异常
 * @returns void
 */
main().catch((error) => {
  console.error("应用启动失败:", error);
  if (error.stack) {
    console.error("错误堆栈:", error.stack);
  }
  if (error.cause) {
    console.error("错误原因:", error.cause);
  }
  process.exit(1);
});
