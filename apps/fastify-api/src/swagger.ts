/**
 * Swagger API 文档配置
 *
 * @description 配置和启动 Swagger API 文档，提供完整的 API 接口文档和交互式测试界面
 *
 * ## 业务规则
 *
 * ### 访问规则
 * - 文档路径：/api-docs
 * - JSON 规范：/api-docs-json
 * - 支持 Bearer Token 认证
 *
 * ### 安全规则
 * - 生产环境可选择性禁用
 * - 支持 API 认证和授权
 *
 * @since 1.0.0
 */

import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppConfig } from "./config/app.config.js";

/**
 * 设置 Swagger API 文档
 *
 * @description 为应用配置完整的 Swagger API 文档
 *
 * ## 业务规则
 * - 自动扫描所有控制器和 DTO
 * - 生成 OpenAPI 3.0 规范
 * - 提供交互式 API 测试界面
 *
 * @param {NestFastifyApplication} app - NestJS Fastify 应用实例
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * const app = await NestFactory.create<NestFastifyApplication>(...);
 * await setupSwagger(app);
 * await app.listen(3000);
 * // 访问: http://localhost:3000/api-docs
 * ```
 */
export const setupSwagger = async (
  app: NestFastifyApplication,
): Promise<void> => {
  // 获取配置
  const appConfig = app.get(AppConfig);

  // 检查是否启用 Swagger
  if (!appConfig.swagger.enabled) {
    console.log("📚 Swagger is disabled");
    return;
  }

  const config = new DocumentBuilder()
    .setTitle("HL8 SAAS Platform API")
    .setDescription(
      "🚀 HL8 SAAS 平台企业级 RESTful API\n\n" +
        "## 特性\n" +
        "- 🔐 基于 JWT 的认证和授权\n" +
        "- 🏢 多租户数据隔离\n" +
        "- 📊 完整的 CRUD 操作\n" +
        "- ⚡ 高性能缓存\n" +
        "- 🛡️ 安全防护和限流\n" +
        "- 📝 标准化错误响应（RFC7807）\n\n" +
        "## 认证\n" +
        "大部分 API 需要 Bearer Token 认证。\n" +
        '点击右上角 "Authorize" 按钮输入您的 Token。',
    )
    .setVersion("1.0.0")
    .setContact(
      "HL8 SAAS Platform Team",
      "https://github.com/your-org/hl8-saas-platform",
      "support@hl8.com",
    )
    .setLicense("MIT", "https://opensource.org/licenses/MIT")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth", // 这个名称将在控制器中使用 @ApiBearerAuth('JWT-auth')
    )
    .addTag("健康检查", "系统健康状态和性能指标")
    .addTag("认证", "用户认证和授权相关接口")
    .addTag("用户管理", "用户 CRUD 操作")
    .addTag("租户管理", "租户配置和管理")
    .addTag("组织管理", "组织架构管理")
    .addServer(appConfig.swagger.serverUrl, "Development Server")
    .addServer(appConfig.swagger.stagingUrl, "Staging Server")
    .addServer(appConfig.swagger.productionUrl, "Production Server")
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
  });

  // 设置 Swagger UI
  SwaggerModule.setup("api-docs", app, document, {
    customSiteTitle: "HL8 SAAS Platform API 文档",
    customfavIcon: "/favicon.ico",
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #1890ff; }
    `,
    swaggerOptions: {
      persistAuthorization: true, // 持久化认证信息
      displayRequestDuration: true, // 显示请求耗时
      filter: true, // 启用搜索过滤
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true, // 默认启用 "Try it out"
    },
  });

  console.log("📚 Swagger documentation is available at:");
  console.log(`   📖 UI: http://localhost:${appConfig.PORT}/api-docs`);
  console.log(`   📄 JSON: http://localhost:${appConfig.PORT}/api-docs-json`);
};
