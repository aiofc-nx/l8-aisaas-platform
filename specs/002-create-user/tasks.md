# Tasks: 用户管理与认证模块

**Input**: Design documents from `/specs/002-create-user/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

> **注意**：任务描述全部使用中文，并在实现类任务中明确 TSDoc、中文错误消息、`@hl8/config` 与 `@hl8/logger` 的落实方式。

**Tests**: 规范要求核心场景具备契约与集成测试，因此相应故事阶段包含测试任务。

**Organization**: 任务按用户故事分组，保证每个故事可独立实施与验证。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件、无依赖）
- **[Story]**: 所属用户故事（US1、US2）
- 任务描述中必须包含确切文件路径

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 更新依赖与工作区配置，为多租户 + CQRS + ES 架构做准备

- [x] T001 在 `package.json` 中新增/升级 `@nestjs/cqrs`、`nestjs-cls`、`@mikro-orm/core`、`@mikro-orm/postgresql`、`@mikro-orm/mongodb` 等依赖并写明用途（确保中文备注）
- [x] T002 更新 `pnpm-workspace.yaml` 注册 `libs/infra/multi-tenancy` 与新增模块路径，保证工作区可构建
- [x] T003 同步更新 `tsconfig.base.json` 的 `paths` 映射以指向 `libs/infra/multi-tenancy`、`libs/modules/user`、`libs/modules/auth`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 多租户上下文、持久化、配置等基础能力；所有用户故事开始前必须完成

- [x] T004 创建 `libs/infra/multi-tenancy` 工程骨架（包含 `package.json`、`tsconfig`、`src/index.ts`、`README.md`），并在 README 中写明多租户职责
- [x] T005 [P] 在 `libs/infra/multi-tenancy/src/lib/tenant-context.module.ts` 实现基于 `nestjs-cls` 的 `TenantContextModule`，提供全局 CLS 注册与中文 TSDoc
- [x] T006 [P] 在 `libs/infra/multi-tenancy/src/lib/tenant-context.executor.ts` 编写 `TenantContextExecutor`，封装 CLS 校验逻辑并输出中文错误“缺少租户上下文”
- [x] T007 [P] 在 `libs/infra/multi-tenancy/src/lib/interceptors/tenant-enforce.interceptor.ts` 实现 `TenantEnforceInterceptor` 与守卫，集成 `@hl8/logger` 中文日志与白名单校验
- [x] T008 在 `libs/infra/multi-tenancy/src/lib/persistence/base-tenant.repository.ts` 实现继承 MikroORM 的 `BaseTenantRepository`，自动追加 `tenantId` 条件并记录越权日志
- [x] T009 [P] 在 `libs/infra/multi-tenancy/src/lib/persistence/tenant-aware.subscriber.ts` 实现事件订阅器，确保 `beforeCreate`/`beforeUpdate` 写入租户并抛出中文异常
- [x] T010 在 `libs/infra/persistence/src/lib/mikro-orm.config.ts` 配置 PostgreSQL + MongoDB 多数据源，挂载租户过滤器与 `TenantAwareSubscriber`
- [x] T011 更新 `apps/fastify-api/src/app.module.ts` 引入 `TenantContextModule`、`@nestjs/cqrs`、MikroORM 配置，并设置全局拦截器
- [x] T012 在 `apps/fastify-api/src/main.ts` 注册 CLS 中间件、租户拦截器与全局异常处理，强化中文日志输出

---

## Phase 3: User Story 1 - 平台管理员创建租户用户 (Priority: P1) 🎯 MVP

**Goal**: 平台管理员可在指定租户下创建首个租户用户，返回唯一标识与初始状态

**Independent Test**: 通过契约与集成测试验证成功创建、邮箱冲突、手机号非法、租户缺失等场景

- ### Tests for User Story 1

- [x] T013 [P] [US1] 在 `tests/contract/user/create-user.contract.spec.ts` 编写契约测试，覆盖成功/冲突/租户缺失案例
- [x] T014 [P] [US1] 在 `apps/fastify-api/test/integration/user/create-user.controller.spec.ts` 编写集成测试，串联守卫、CLS、仓储桩

### Implementation for User Story 1

- [x] T015 [P] [US1] 在 `libs/domains/user/src/domain/value-objects` 补充/校验 `EmailAddress`、`DisplayName`、`MobilePhone` 等值对象的中文 TSDoc 与校验规则
- [x] T016 [US1] 在 `libs/domains/user/src/domain/aggregates/user.aggregate.ts` 核对并扩展 `User.create` 行为，确保发布领域事件与中文日志
- [x] T017 [US1] 在 `libs/domains/user/src/application/commands/create-tenant-user.command.ts` 定义命令及 DTO，要求携带 `TenantId`、平台管理员 ID
- [x] T018 [US1] 在 `libs/domains/user/src/application/handlers/create-tenant-user.command-handler.ts` 实现命令处理器，调用 `TenantContextExecutor`、写入事件存储并返回领域事件
- [x] T019 [US1] 在 `libs/domains/user/src/application/events/user-created.domain-event.ts` 及处理器中写入 MongoDB 事件存储和读模型
- [x] T020 [P] [US1] 在 `libs/infra/persistence/postgres/src/repositories/user.repository.ts` 扩展/改造为继承 `BaseTenantRepository` 并实现邮箱查重
- [x] T021 [P] [US1] 在 `libs/infra/persistence/postgres/src/repositories/user-projection.repository.ts` 实现读模型仓储，追加 `tenant_id` 复合索引
- [x] T022 [US1] 在 `apps/fastify-api/src/modules/user/user.module.ts` 注册命令/事件处理器与仓储实现，注入多租户依赖
- [x] T023 [US1] 在 `apps/fastify-api/src/modules/user/controllers/create-user.controller.ts` 实现 REST 接口，编写中文 TSDoc、DTO 校验与错误转换
- [x] T024 [US1] 在 `libs/domains/auth/src/application/services/casl-ability.factory.ts` 补充 `manage:User` 权限，确保 CASL 校验租户上下文

---

## Phase 4: User Story 2 - 平台管理员登录并获取访问令牌 (Priority: P1)

**Goal**: 平台管理员通过统一认证入口获取访问/刷新令牌，并在 CLS 中写入租户上下文

**Independent Test**: 通过契约与集成测试验证登录成功、凭证错误、权限不足、刷新令牌轮换等场景

### Tests for User Story 2

- [ ] T025 [P] [US2] 在 `tests/contract/auth/login.contract.spec.ts` 编写登录契约测试，覆盖成功与 401/403 场景
- [ ] T026 [P] [US2] 在 `apps/fastify-api/test/integration/auth/auth.controller.spec.ts` 编写集成测试，验证 JWT 策略、CLS、CASL

### Implementation for User Story 2

- [ ] T027 [P] [US2] 在 `libs/domains/auth/src/domain/value-objects` 校验并补充 `AccessToken`、`RefreshToken`、`SessionId` 值对象的中文错误定义
- [ ] T028 [US2] 在 `libs/domains/auth/src/domain/aggregates/auth-session.aggregate.ts` 实现 `issue`/`refresh`/`revoke` 行为
- [ ] T029 [US2] 在 `libs/domains/auth/src/application/commands/login.command.ts` 定义登录命令，包含租户解析结果与凭证
- [ ] T030 [US2] 在 `libs/domains/auth/src/application/handlers/login.command-handler.ts` 实现命令处理器，加载用户 + 角色 + 权限，生成令牌并写入 CLS（含中文日志）
- [ ] T031 [P] [US2] 在 `libs/domains/auth/src/application/services/token-builder.service.ts` 与 `token.service.ts` 实现 TokenBuilder/TokenService 组合
- [ ] T032 [P] [US2] 在 `libs/infra/persistence/postgres/src/repositories/auth-session.repository.ts` 或同类位置实现会话仓储，继承 `BaseTenantRepository`
- [ ] T033 [US2] 在 `apps/fastify-api/src/modules/auth/strategies/jwt.strategy.ts` 更新策略，解析租户信息、调用 `TenantContextExecutor`、写入 CLS，并提供中文错误“登录凭证无效”
- [ ] T034 [US2] 在 `apps/fastify-api/src/modules/auth/controllers/auth.controller.ts` 实现登录与刷新接口（中文 TSDoc + DTO 校验 + 错误处理）
- [ ] T035 [US2] 在 `apps/fastify-api/src/modules/auth/auth.module.ts` 注册命令/查询/守卫，配置 `TenantEnforceInterceptor` 与 CASL 依赖

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 文档、性能、安全等跨故事改进

- [ ] T036 [P] 更新 `docs/quickstart.md` 与 `docs/multi-tenant-design.md`，补充新命令、租户上下文验证步骤
- [ ] T037 合并 `docker-compose.yml` 与 `apps/fastify-api/mikro-orm.config.ts` 中的连接配置，验证 PostgreSQL/MongoDB 启动顺序
- [ ] T038 [P] 在 `tests/contract/` 与 `apps/fastify-api/test/integration/` 运行全套测试并校验覆盖率门槛
- [ ] T039 完成 `libs/domains/user`、`libs/domains/auth`、`libs/infra/multi-tenancy` 中的 TSDoc、中文错误消息抽查与 `@hl8/logger` 日志统一
- [ ] T040 执行 `quickstart.md` 中的手动验证流程，确保租户隔离与 CLS 日志正确

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖，可立即开始
- **Foundational (Phase 2)**: 依赖 Phase 1，完成后方可进入任何用户故事
- **User Story 1 (Phase 3)**: 依赖 Phase 2，完成后可作为 MVP 交付
- **User Story 2 (Phase 4)**: 依赖 Phase 2，可与 US1 并行但需尊重租户上下文约束
- **Polish (Phase 5)**: 依赖所有目标用户故事完成

### User Story Dependencies

- **US1**：多租户 + 用户域基础，完成后平台管理员可创建首个租户用户
- **US2**：在多租户上下文中完成登录授权，可独立验证但需复用 US1 的租户/角色信息

### Task Parallelism

- `[P]` 任务使用不同文件且无前置依赖，可在同阶段并行
- 完成 Phase 2 后，可由不同成员并行推进 US1 与 US2
- 契约测试与集成测试任务在实现开始前即可并行编写

---

## Parallel Example: User Story 1

```bash
# 并行启动 US1 的测试骨架
pnpm exec jest --watch --testPathPattern=tests/contract/user/create-user.contract.spec.ts
pnpm --filter apps/fastify-api exec jest --watch --testPathPattern=test/integration/user/create-user.controller.spec.ts

# 并行实现领域与基础设施
code libs/modules/user/src/domain/value-objects/email-address.vo.ts \
     libs/modules/user/src/infrastructure/repositories/user.mikro.repository.ts
```

---

## Implementation Strategy

### MVP First（仅交付 User Story 1）

1. 完成 Phase 1 + Phase 2 基础设施
2. 实施 Phase 3（US1）并运行契约 / 集成测试
3. 验证租户隔离与日志，准备 MVP 演示

### Incremental Delivery

1. Setup → Foundational → US1（MVP）
2. 在 US1 稳定后引入 US2，实现完整认证闭环
3. Polish 阶段统一补充文档、日志、测试

### Parallel Team Strategy

1. 团队协作完成 Setup + Foundational
2. 分工：成员 A 聚焦 US1，成员 B 聚焦 US2
3. 共用 CLS / 租户基建，保持契约与集成测试同步推进

---

## Notes

- `[P]` 任务 = 不同文件、无强依赖，可并行
- `[Story]` 标签 = 追踪任务与用户故事的映射关系
- 所有实现任务必须补齐中文 TSDoc、中文错误消息与 `@hl8/logger` 日志
- 每个用户故事均需独立可测试，完成后可作为增量交付

# Tasks · 用户管理与认证模块

**Branch**: `002-create-user` | **Spec**: [spec.md](../spec.md) | **Plan**: [plan.md](../plan.md)

> 任务以用户故事为核心，遵循循序渐进、可独立测试的增量策略。测试任务按需求拆解，确保登录/授权闭环可独立验证。

---

## Phase 1 · Setup

- [x] T001 建立 `libs/modules/user` 包骨架（package.json、tsconfig、jest.config.ts、src/index.ts、README）
- [x] T002 配置 Fastify 模块目录结构（`apps/fastify-api/src/modules/user/`、controller、dto、providers）
- [x] T003 更新 `apps/fastify-api/app.module.ts` 注册 `UserModule`
- [x] T004 更新 `apps/fastify-api/test/integration/user/` 集成测试基线
- [x] T005 生成 `tests/contract/user/` OpenAPI 契约测试基线
- [x] T006 更新 `quickstart.md` 用户模块初始化说明
- [x] T033 [P] 建立 `libs/modules/auth` 包结构（package.json、tsconfig、jest.config.ts、src/index.ts、README）
- [x] T034 [P] 在 `apps/fastify-api/src/modules` 下创建 `auth/` 目录与基础 module/controller/dto 框架
- [x] T035 [P] 调整 `apps/fastify-api/tsconfig.json` 与根配置，加入 `@hl8/auth` 路径映射
- [x] T036 [P] 更新 `pnpm-workspace.yaml` 与相关 package.json，纳入新包
- [x] T037 [P] 配置 `libs/modules/auth` 的 Jest 测试与 tsconfig
- [x] T038 [P] 在 `apps/fastify-api/test/integration/auth/` 建立测试目录及基线文件

## Phase 2 · Foundational

- [x] T007 定义认证配置类 `AuthConfig`（`libs/modules/auth/src/domain/config/auth.config.ts`），使用 `class-validator` 校验秘钥、过期时间、Header 名称
- [x] T008 实现 Token 值对象与会话聚合（`AuthSession`、`AccessToken`、`RefreshToken`、`SessionId` 等）以及枚举（SessionStatus）
- [x] T009 建模 `Role`、`Permission` 实体（`libs/modules/auth/src/domain/entities`），与 CASL 能力契合
- [x] T010 为 `AuthSession` 聚合补充 `UserId`、`TenantId` 等值对象引用，保证聚合内部强类型
- [x] T011 定义领域事件 `AuthSessionCreatedDomainEvent`、`TokensRefreshedDomainEvent`
- [x] T012 定义 `AuthSessionRepository` 接口与内存实现
- [x] T013 在 `libs/modules/auth/src/index.ts` 导出公共 API
- [x] T014 更新 `libs/modules/auth/README.md` 对齐模块目的与结构
- [x] T039 定义 Token payload 值对象（`AccessTokenPayload`、`RefreshTokenPayload`）
- [x] T040 实现 `AuthSessionStatus` 枚举与状态验证（结合吊销、过期逻辑）
- [x] T041 定义领域事件 `AuthSessionCreatedDomainEvent`、`TokensRefreshedDomainEvent` 的序列化格式
- [x] T042 在 `libs/modules/auth/src/interfaces` 中定义 `AuthSessionRepository` 接口及内存实现（含刷新令牌索引）
- [x] T043 在 `libs/modules/auth/src/application/commands` 中定义 `LoginCommand`、`RefreshCommand` 数据结构
- [x] T044 建立 `libs/modules/auth/src/application/services` 目录并创建 `LoginService`、`RefreshService` 雏形文件
- [x] T045 添加 `@hl8/logger` 注入基类，准备应用服务日志输出
- [x] T046 更新 `quickstart.md` 中命令/依赖说明（确认新增包安装步骤无遗漏）

## Phase 3 · User Story 1 （平台管理员创建租户用户）

- [x] T015 实现 `CreateTenantUserCommand` 验证逻辑（class-validator + DDD 约束）
- [x] T016 在 `User` 聚合中实现 `create` 工厂方法（校验、事件记录）
- [x] T017 实现 `EmailAlreadyExistsException` 领域异常
- [x] T018 在 `CreateTenantUserService` 中校验平台范围邮箱唯一性
- [x] T019 将 `UserRepository` 注入 `CreateTenantUserService`（内存实现）
- [x] T020 `CreateTenantUserService` 记录领域事件并返回用户聚合
- [x] T021 在 `libs/modules/user/tests/unit/domain` 下编写 `User` 聚合单测
- [x] T022 在 `libs/modules/user/tests/unit/application` 下编写 `CreateTenantUserService` 单测
- [x] T023 在 `apps/fastify-api/src/modules/user/dto` 中编写 DTO + class-validator 校验
- [x] T024 在 `apps/fastify-api/src/modules/user/providers` 中注册内存仓储与应用服务
- [x] T025 在 `UserController` 中实现 `POST /tenants/:tenantId/users`
- [x] T026 在 `test/integration/user/create-user.controller.spec.ts` 中编写成功/失败用例
- [x] T027 在 `tests/contract/user/create-user.contract.spec.ts` 中校验 OpenAPI 契约

## Phase 4 · User Story 2 & 3 （用户登录与授权）

- [x] T047 在 `AuthSession` 聚合中实现 `issue` 工厂方法与 Token 签发逻辑
- [x] T048 在 `LoginService` 中实现业务用例：用户认证、Token 签发、会话记录
- [x] T049 在 `RefreshService` 中实现业务用例：Token 刷新、会话更新
- [x] T050 在 `libs/modules/auth/tests/unit` 编写领域与应用服务单元测试（登录成功、密码错误、Token 过期等）
- [x] T051 在 `apps/fastify-api/src/modules/auth/dto/login.dto.ts`、`refresh.dto.ts` 编写 DTO + class-validator 校验
- [x] T052 在 `apps/fastify-api/src/modules/auth/auth.module.ts` 注册服务、仓储提供者
- [x] T053 在 `apps/fastify-api/src/modules/auth/controllers/auth.controller.ts` 实现 `POST /auth/login`、`POST /auth/refresh`
- [x] T054 在 `apps/fastify-api/test/integration/auth/auth.controller.spec.ts` 编写集成测试（登录成功、刷新成功、无效凭证）
- [x] T055 添加契约测试或快照，确保 `contracts/auth.login.openapi.yaml` 与实现一致
- [x] T056 在 `libs/modules/auth` 中定义 `Permission`、`Role`、`Actions`、`Subjects` 值对象/枚举
- [x] T057 在 `libs/modules/auth/src/application/services` 中创建 `CaslAbilityFactory`
- [x] T058 在 `apps/fastify-api/src/modules/auth/guards/policies.guard.ts` 实现 `PoliciesGuard`
- [x] T059 在 `apps/fastify-api/src/modules/auth/decorators/check-policies.decorator.ts` 实现 `@CheckPolicies` 装饰器
- [x] T060 在 `apps/fastify-api/src/modules/user/controllers/user.controller.ts` 中使用 `PoliciesGuard` 和 `@CheckPolicies` 保护用户创建接口
- [x] T061 在 `libs/modules/auth/tests/unit` 编写 CASL 能力工厂相关单元测试
- [x] T062 在 `apps/fastify-api/test/integration/auth/authorization.spec.ts` 编写授权集成测试（无 Header、权限不足、权限满足）
- [x] T063 在 `libs/modules/auth/src/index.ts` 导出授权相关公共 API（Actions、Subjects、CaslAbilityFactory、AppAbility）
- [x] T064 补充中文 TSDoc 与 `@hl8/logger` 日志输出（涵盖能力工厂、守卫）
- [x] T065 更新 `specs/002-create-user/quickstart.md`，说明授权 Header 与集成测试命令
