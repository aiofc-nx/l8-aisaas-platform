# Tasks: 多层缓存架构方案

**Input**: Design documents from `/specs/001-cache-strategy/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

> **注意**：任务描述使用中文，确保在实现中补齐 TSDoc 注释、中文错误消息，并始终通过 `@hl8/config`、`@hl8/logger` 与 `libs/infra/exceptions` 完成配置、日志和异常管理。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 初始化缓存基础设施包及依赖

- [x] T001 在 `libs/infra/cache/` 创建包结构与 `package.json`、`tsconfig.json`、`src/index.ts`
- [x] T002 更新 `pnpm-workspace.yaml` 与根级 `package.json` 将 `libs/infra/cache` 纳入工作区并声明缓存依赖
- [x] T003 [P] 在 `libs/infra/cache/src/index.ts` 导出占位符模块与中文 TSDoc 注释

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 搭建所有用户故事共用的核心能力

- [x] T004 在 `libs/infra/cache/src/config/` 实现 `CacheConfig`、`RedisCommonConfig`、`RedisClientConfig`、`RedisLockConfig`，使用 `@hl8/config` 与 `class-validator` 校验并输出中文错误
- [x] T005 [P] 在 `libs/infra/cache/src/bootstrap/setup-redis.module.ts` 实现 `setupRedisModule`，整合 `@liaoliaots/nestjs-redis` 并使用 `libs/infra/exceptions` 包装异常
- [x] T006 [P] 在 `libs/infra/cache/src/bootstrap/setup-redis-lock.module.ts` 实现 `setupRedisLockModule`，集成 `@anchan828/nest-redlock` 并统一中文日志
- [x] T007 [P] 在 `libs/infra/cache/src/keys/abstract-key.builder.ts` 定义抽象键生成器，含中文 TSDoc 与输入校验
- [x] T008 在 `libs/infra/cache/src/services/cache-client.provider.ts` 封装 Redis 客户端获取、命名空间拼装、错误转译
- [x] T009 [P] 在 `libs/infra/cache/src/monitoring/cache-metrics.hook.ts` 定义命中率、回源率、锁等待指标上报逻辑并使用 `@hl8/logger`

**Checkpoint**: 基础能力完成，允许进入各用户故事实现

---

## Phase 3: User Story 1 - 平台接口命中缓存 (Priority: P1) 🎯 MVP

**Goal**: 为租户热点数据提供统一命名空间的高命中缓存读写接口

**Independent Test**: 通过集成测试验证租户接口第二次请求命中缓存且键命名符合策略

### Tests for User Story 1

- [x] T010 [P] [US1] 在 `apps/fastify-api/test/integration/cache/tenant-config.cache.spec.ts` 编写集成测试覆盖首次回源与后续命中
- [x] T011 [P] [US1] 在 `libs/infra/cache/src/keys/tenant-config-key.builder.spec.ts` 编写单元测试验证键生成边界

### Implementation for User Story 1

- [x] T012 [P] [US1] 在 `libs/infra/cache/src/keys/tenant-config-key.builder.ts` 实现租户配置键生成器（含中文 TSDoc、异常）
- [x] T013 [P] [US1] 在 `libs/infra/cache/src/services/cache-read.service.ts` 实现命名空间读服务，调用 Redis 并记录中文日志
- [x] T014 [US1] 在 `apps/fastify-api/src/modules/tenant-config/tenant-config.service.ts` 接入 `CacheReadService`，缓存命中、回源逻辑与 CLS 上下文写入
- [x] T015 [US1] 在 `apps/fastify-api/src/modules/tenant-config/tenant-config.controller.ts` 使用缓存响应请求并返回中文错误
- [x] T016 [US1] 更新 `apps/fastify-api/src/app.module.ts` 注入 `CacheModule` 与命名空间配置

**Checkpoint**: 用户故事 1 功能自洽，可独立演示租户缓存命中

---

## Phase 4: User Story 2 - 运维配置缓存策略 (Priority: P2)

**Goal**: 运维可通过接口查看与维护缓存命名空间、TTL 等策略并得到中文反馈

**Independent Test**: 通过契约与集成测试验证配置接口返回策略列表并在校验失败时提供中文错误

### Tests for User Story 2

- [x] T017 [P] [US2] 在 `tests/contract/cache/cache-management.contract.spec.ts` 编写契约测试对齐 `contracts/cache-management.openapi.yaml`
- [x] T018 [US2] 在 `apps/fastify-api/test/integration/cache/cache-namespace.controller.spec.ts` 编写集成测试覆盖配置缺失与成功场景

### Implementation for User Story 2

- [x] T019 [P] [US2] 在 `libs/infra/cache/src/config/cache-namespace.registry.ts` 建立策略注册表与热加载监听
- [x] T020 [US2] 在 `libs/infra/cache/src/services/cache-namespace.service.ts` 实现策略查询、校验、中文异常
- [x] T021 [US2] 在 `apps/fastify-api/src/modules/cache/cache-namespace.controller.ts` 实现 `GET /internal/cache/namespaces`
- [x] T022 [US2] 在 `apps/fastify-api/src/modules/cache/cache.module.ts` 组合服务、控制器并注入到应用主模块

**Checkpoint**: 用户故事 2 实现，运维可查看配置并收到中文提示

---

## Phase 5: User Story 3 - 业务侧控制数据一致性 (Priority: P3)

**Goal**: 写操作后触发延迟双删、失效通知及锁控制，保障数据一致性

**Independent Test**: 通过集成测试验证写后缓存失效与通知触发，同时锁冲突时返回中文错误

### Tests for User Story 3

- [x] T023 [P] [US3] 在 `tests/contract/cache/cache-consistency.contract.spec.ts` 编写契约测试覆盖写后延迟双删、失效通知和预取接口定义

### Implementation for User Story 3

- [x] T024 [US3] 在 `libs/infra/cache/src/services/cache-consistency.service.ts` 实现缓存一致性服务（持锁执行写前删除与延迟双删，并记录中文通知）
- [x] T025 [US3] 提供缓存失效/预热 API 与事件通知（`apps/fastify-api/src/modules/cache/cache-consistency.controller.ts`），并补充锁竞争与通知的集成测试
