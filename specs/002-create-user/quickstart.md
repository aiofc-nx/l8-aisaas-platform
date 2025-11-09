# Quickstart · 用户管理与认证模块

## 先决条件

- Node.js ≥ 20，pnpm ≥ 8（项目根已配置）
- Docker Compose（用于启动 PostgreSQL、MongoDB、Redis 等依赖服务，如需）
- 已拉取 `002-create-user` 分支并安装依赖：`pnpm install`
- 设置本地开发环境变量（示例命令）：

```bash
export NODE_ENV=development
export CACHE_REDIS_USE_MEMORY=true      # 若未启动 Redis
export APP_PORT=3001
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_USER=hl8_local
export POSTGRES_PASSWORD=hl8_local_pw
export POSTGRES_DB=hl8_platform
export MONGO_URI="mongodb://localhost:27017/hl8_platform"
export AUTH_ACCESS_TOKEN_SECRET=dev-access-secret
export AUTH_REFRESH_TOKEN_SECRET=dev-refresh-secret
export AUTH_ACCESS_TOKEN_EXPIRES_IN=3600s
export AUTH_REFRESH_TOKEN_EXPIRES_IN=604800s
```

- 如需体验多租户权限，请在数据库或内存种子中准备至少一个角色及权限集合（示例：`tenant-admin` 拥有 `User.ReadAny`、`Tenant.Manage` 等权限）。

## 启动步骤

1. **启动依赖服务（可选）**
   ```bash
   docker compose up -d postgres mongodb redis
   # 如需使用 pgAdmin / Redis Commander，可附加 `pgadmin`、`redis-commander` 服务
   ```
2. **运行 Fastify API**

   ```bash
   pnpm --filter apps/fastify-api start:dev
   ```

   - 首次运行前可执行 MikroORM 迁移/种子（命令待实现）：`pnpm --filter apps/fastify-api mikro-orm:migration:up`、`pnpm --filter apps/fastify-api mikro-orm:seeder:run`

3. **平台管理员登录**

   ```bash
   curl -X POST http://localhost:3001/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "Admin@123"
     }'
   ```

   - 正确凭证 → 返回 `accessToken`、`refreshToken`、`expiresIn` 等字段。
   - 失败 → 返回中文错误“登录凭证无效”。

4. **访问受保护接口（示例：创建用户）**

   ```bash
   ACCESS_TOKEN=<登录响应中的 accessToken>
   TENANT_ID=11111111-1111-4111-8111-111111111111
   curl -X POST http://localhost:3001/internal/tenants/${TENANT_ID}/users \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ${ACCESS_TOKEN}" \
     -d '{
       "displayName": "张晓明",
       "email": "zhangxm@example.com",
       "mobile": "13800138000",
       "roles": ["tenant-admin"]
     }'
   ```

5. **刷新令牌**

   ```bash
   REFRESH_TOKEN=<登录响应中的 refreshToken>
   curl -X POST http://localhost:3001/auth/refresh \
     -H "Content-Type: application/json" \
     -d "{\"refreshToken\":\"${REFRESH_TOKEN}\"}"
   ```

   - 若刷新成功 → 返回新的访问/刷新令牌。
   - 若令牌过期或被吊销 → 返回中文错误“刷新令牌无效或已过期”。

## 测试说明

| 测试类型   | 命令示例                                                                                                                                                                                                                                                                                       | 说明                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 单元测试   | `pnpm --filter libs/modules-user test`<br>`pnpm --filter libs/modules-auth test`                                                                                                                                                                                                               | 用户领域/应用逻辑、认证 Token/CASL 能力、CQRS Handler 的单元测试 |
| 集成测试   | `pnpm --filter apps/fastify-api exec jest ../test/integration/user/create-user.controller.spec.ts`<br>`pnpm --filter apps/fastify-api exec jest ../test/integration/auth/auth.controller.spec.ts`<br>`pnpm --filter apps/fastify-api exec jest ../test/integration/auth/authorization.spec.ts` | Fastify 控制器 + 守卫 + 仓储桩 + CLS 流程                        |
| 契约测试   | `pnpm exec jest --config tests/jest.config.ts --testPathPatterns=contract/user`<br>`pnpm exec jest --config tests/jest.config.ts --testPathPatterns=contract/auth`                                                                                                                             | 校验用户、认证相关 OpenAPI 契约与实现一致性                      |
| Lint/TSDoc | `pnpm run lint`                                                                                                                                                                                                                                                                                | 确保中文注释、TSDoc 与格式规范                                   |

> 覆盖率目标：核心业务逻辑 ≥80%，关键路径（创建用户、登录/刷新流程）≥90%，所有公共 API 均须具备测试用例。

## 常见问题

- **邮箱冲突提示**：如收到 `邮箱已被占用` 错误，表示平台范围内已有同邮箱用户。请更换邮箱或等待邀请功能迭代。
- **权限不足** | 若返回 403 `无权访问当前资源`，请确认发起请求的访问令牌所对应的管理员具备 `manage:User` 权限；可通过登录接口返回的 token 解码权限列表，或在内存仓储中补充权限配置。
- **令牌失效**：访问或刷新令牌失效时，日志会输出中文错误并记录 CLS 中的 `userId`、`tenantId`；请确认秘钥、时钟同步及刷新策略。
- **事件存储未连接**：若启用了事件溯源但未启动 MongoDB，将在命令处理器日志中看到“事件存储写入失败，回退至内存实现”的警告；请检查 `MONGO_URI` 并确保实例可用。
- **多租户上下文**：JWT 守卫会尝试解析租户，如 CLS 中不存在租户 ID，请确认 Header 或 payload 是否包含租户信息，以及 `TenantResolutionService` 是否正确注入。

## 后续迭代参考

- 接入 PostgreSQL 仓储实现，替换内存仓储，并实现刷新令牌吊销列表。
- 引入密码初始化/找回流程，与外部身份提供商对接。
- 扩展角色与权限管理后台，对接 CASL 枚举自动生成策略。
- 集成安全审计与异常告警（令牌使用异常、权限滥用等）。
- 为事件溯源引入快照与重放工具，保障 MongoDB 事件仓储数据可观测。
