# NestJS + Fastify API 示例项目

这是一个基于 NestJS 和 Fastify 的简单 API 示例项目，展示了如何使用 NestJS 框架构建 RESTful API。

## 项目特性

- 🚀 **NestJS 框架** - 基于 TypeScript 的渐进式 Node.js 框架
- ⚡ **Fastify 适配器** - 高性能的 HTTP 服务器
- ⚙️ **类型安全配置** - 基于 @hl8/config 的类型安全配置管理
- 📝 **数据验证** - 使用 class-validator 进行请求数据验证
- 🧪 **单元测试** - 完整的测试覆盖
- 📚 **TSDoc 注释** - 完整的中文文档注释
- 🏗️ **模块化架构** - 清晰的模块分离
- 🔍 **健康检查** - 配置状态监控和健康检查端点

## 项目结构

```
src/
├── app.controller.ts          # 应用主控制器
├── app.service.ts             # 应用主服务
├── app.module.ts              # 应用主模块
├── main.ts                    # 应用入口文件
├── config/                    # 配置模块
│   ├── app.config.ts          # 主配置类
│   ├── database.config.ts     # 数据库配置
│   ├── server.config.ts       # 服务器配置
│   ├── cors.config.ts         # CORS 配置
│   ├── logging.config.ts      # 日志配置
│   ├── config-health.controller.ts # 配置健康检查控制器
│   ├── validation-messages.ts # 验证错误消息
│   └── index.ts               # 配置导出
├── users/                     # 用户模块
│   ├── users.controller.ts    # 用户控制器
│   ├── users.service.ts       # 用户服务
│   ├── users.module.ts        # 用户模块
│   ├── dto/                   # 数据传输对象
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   └── entities/              # 实体类
│       └── user.entity.ts
└── test/                      # 测试文件
    └── integration/           # 集成测试
        ├── config.integration.spec.ts
        ├── config-validation.spec.ts
        └── config-health.spec.ts

config/                        # 配置文件
├── app.yml                   # 主配置文件 (YAML)
├── app.json                  # 主配置文件 (JSON)
└── .env.example              # 环境变量模板

docs/                         # 文档
└── configuration.md          # 配置管理文档
```

## API 端点

### 应用基础端点

- `GET /` - 获取欢迎信息
- `GET /health` - 获取应用健康状态

### 配置管理端点

- `GET /health/config` - 获取配置健康状态
- `GET /health/config/summary` - 获取配置摘要信息

### 用户管理端点

- `POST /users` - 创建新用户
- `GET /users` - 获取所有用户
- `GET /users/:id` - 根据ID获取用户
- `PATCH /users/:id` - 更新用户信息
- `DELETE /users/:id` - 删除用户

## 安装和运行

### 安装依赖

```bash
pnpm install
```

### 配置设置

1. **复制环境变量模板**：

   ```bash
   cp config/.env.example .env
   ```

2. **编辑配置文件**：
   - 修改 `config/app.yml` 中的配置值
   - 或设置环境变量覆盖配置

3. **配置说明**：
   - 详细配置说明请参考 [配置管理文档](docs/configuration.md)
   - 支持 YAML、JSON 和环境变量多种配置方式

### 开发模式运行

```bash
pnpm run start:dev
```

### 生产模式运行

```bash
pnpm run build
pnpm run start:prod
```

### 运行测试

```bash
# 运行所有测试
pnpm run test

# 监听模式运行测试
pnpm run test:watch

# 生成测试覆盖率报告
pnpm run test:cov
```

### 代码检查

```bash
pnpm run lint
```

## API 使用示例

### 创建用户

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "email": "zhangsan@example.com",
    "password": "password123"
  }'
```

### 获取所有用户

```bash
curl http://localhost:3000/users
```

### 获取特定用户

```bash
curl http://localhost:3000/users/1
```

### 更新用户

```bash
curl -X PATCH http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三（已更新）"
  }'
```

### 删除用户

```bash
curl -X DELETE http://localhost:3000/users/1
```

### 配置健康检查

```bash
# 检查配置健康状态
curl http://localhost:3000/health/config

# 获取配置摘要
curl http://localhost:3000/health/config/summary
```

## 配置管理

本项目集成了类型安全的配置管理系统，支持多种配置格式和环境变量覆盖。

### 配置特性

- ✅ **类型安全** - 完整的 TypeScript 类型支持
- ✅ **多格式支持** - YAML、JSON、环境变量
- ✅ **验证机制** - 运行时配置验证
- ✅ **健康检查** - 配置状态监控
- ✅ **错误处理** - 详细的错误信息

### 快速开始

1. **查看配置模板**：

   ```bash
   cat config/.env.example
   ```

2. **修改配置**：

   ```bash
   # 编辑 YAML 配置文件
   vim config/app.yml

   # 或设置环境变量
   export APP__NAME="my-app"
   export DATABASE__HOST="localhost"
   ```

3. **验证配置**：

   ```bash
   # 启动应用并检查配置
   pnpm run start:dev

   # 在另一个终端检查配置健康状态
   curl http://localhost:3000/health/config
   ```

### 详细文档

完整的配置管理文档请参考：[配置管理文档](docs/configuration.md)

## 技术栈

- **NestJS** - 11.1.7
- **Fastify** - 通过 @nestjs/platform-fastify
- **TypeScript** - 5.9.3
- **@hl8/config** - 类型安全配置管理
- **class-validator** - 0.14.2
- **class-transformer** - 0.5.1
- **Jest** - 30.2.0 (测试框架)

## 开发规范

- 使用 TSDoc 规范编写中文注释
- 遵循 Clean Architecture 架构模式
- 所有公共 API 必须有完整的文档注释
- 单元测试覆盖率要求 ≥ 80%

## 许可证

MIT License
