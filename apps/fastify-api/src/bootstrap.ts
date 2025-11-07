import { ValidationPipe } from "@nestjs/common";
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppConfig } from "./config/app.config.js";

/**
 * 初始化 NestJS 应用
 *
 * @description 配置 Fastify、中间件、验证、静态资源、日志和 API 文档
 *
 * ## 业务规则
 *
 * ### 应用初始化规则
 * - 配置静态文件服务
 * - 配置全局验证管道
 * - 配置 Swagger API 文档 (非生产环境)
 * - 配置文件上传支持
 *
 * ### 日志记录规则
 * - 使用 @hl8/logger 提供的 PinoLoggerService（全局统一日志）
 * - 零开销，复用 Fastify 内置 Pino 实例
 * - 在非生产环境启用彩色输出
 *
 * @param app - NestFastifyApplication 实例
 * @returns Promise<void> 应用启动完成
 */
export const bootstrap = async (app: NestFastifyApplication): Promise<void> => {
  // 获取配置（使用自定义的 AppConfig）
  const appConfig = app.get(AppConfig);

  // 全局日志服务已通过 PinoLoggingModule 自动配置
  // 所有模块自动使用 PinoLoggerService（零开销，复用 Fastify Pino）

  // 启用 CORS（默认允许跨域，便于前端集成）
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 全局验证管道 - 自动验证请求数据
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 启动应用并监听配置的端口
  const port = appConfig.PORT;
  const host = appConfig.HOST;

  await app.listen(port, host);

  // 输出启动信息
  const displayHost = host === "0.0.0.0" ? "localhost" : host;

  console.log("\n" + "=".repeat(70));
  console.log("🚀 HL8 SAAS 平台应用已成功启动");
  console.log("=".repeat(70));
  console.log(`📍 本地访问:      http://${displayHost}:${port}`);
  console.log(`🌐 网络访问:      http://${host}:${port}`);
  console.log(`📚 API 文档:      http://${displayHost}:${port}/api-docs`);
  console.log(`📄 OpenAPI 文档:  http://${displayHost}:${port}/api-docs-json`);
  console.log("=".repeat(70));
  console.log(`✅ 当前环境:      ${appConfig.NODE_ENV}`);
  console.log(`⚡ 技术栈:        Fastify + NestJS`);
  console.log("=".repeat(70) + "\n");
};
