# Implementation Plan: 用户管理与认证模块

**Branch**: `002-create-user` | **Date**: 2025-11-08 | **Spec**: `/specs/002-create-user/spec.md`
**Input**: Feature specification与增补需求（MikroORM + PostgreSQL + MongoDB、NestJS CQRS、DDD + Clean Architecture + CQRS + ES 混合模式）

> **注意**：计划内容必须使用中文撰写，术语需与项目章程保持一致。

## Summary

本特性聚焦“用户管理 + 认证授权”基线能力，确保平台管理员可创建租户用户、完成登录/令牌刷新，并通过 CASL 策略保护后续 API。技术上将统合 DDD + Clean Architecture + CQRS + 事件溯源（ES）混合模式，并全面落地《docs/multi-tenant-design.md》的多租户与数据隔离机制：领域层复用既有的 `libs/domains/user`、`libs/domains/auth` 充血模型，通过新增命令/查询处理器显式携带 `TenantId` 值对象；应用层通过 `@nestjs/cqrs` 实现职责分离并在执行前校验 CLS 中的租户上下文；基础设施层实现 CLS + `TenantEnforceInterceptor` + 租户感知仓储 + 事件订阅器。事件存储初期以内存 + MongoDB 原型支撑，持久化读写采用 MikroORM 连接 PostgreSQL（交易存储）及 MongoDB（事件溯源、审计日志）。Fastify API 模块以 NestJS 为外层接口，依赖 `@hl8/logger`、`@hl8/config`、`@hl8/async-storage` 完成日志、配置、上下文流转。

## Technical Context

**Language/Version**: Node.js 20.x + TypeScript 5.9（NodeNext 编译目标）  
**Primary Dependencies**: NestJS 11、Fastify 5、`@nestjs/cqrs`、MikroORM 6（PostgreSQL + MongoDB driver）、CASL、`@hl8/*` 内部模块、jsonwebtoken、bcryptjs  
**Storage**: PostgreSQL（命令侧持久化，用户/角色/会话）、MongoDB（事件溯源存储、审计日志）、内存实现（开发/测试阶段兜底）  
**Testing**: Jest（单元）、Supertest + Nest 测试包（集成）、契约测试（OpenAPI + Jest）、后续扩展端到端测试；覆盖率目标：核心逻辑 ≥80%、关键路径 ≥90%  
**Target Platform**: Linux 容器化部署（Fastify API 服务），兼容本地 pnpm workspace 开发环境  
**Project Type**: 企业级 SaaS 后端（monorepo，Node 服务）  
**Performance Goals**: 登录/刷新接口 p95 ≤300ms；批量创建用户 95% 请求 ≤2s；事件入库延迟 ≤500ms；写模型与读模型同步延迟可接受在秒级（后续优化）  
**Constraints**: 严格遵循中文日志与错误提示；禁止使用 CommonJS；配置/日志统一通过 `@hl8` 系列；CQRS/ES 架构要求命令侧与查询侧隔离（共享 DTO 需通过 mapper）；多租户隔离必须遵循 CLS + 拦截器 + 租户仓储 + 事件处理一致性，任何跨租户访问需走白名单审计流程  
**Scale/Scope**: 首期支撑上千租户、单租户百级用户；事件溯源数据按日 10k 事件量设计；后续可弹性扩展

## Constitution Check

_闸门：阶段 0 前完成一次自检，阶段 1 输出后再次确认。_

- **中文优先原则**：计划明确所有文档、日志、错误消息采用中文；变量虽为英文但需在代码中补齐中文 TSDoc 注释。✅
- **代码即文档原则**：公共 API、命令、查询、守卫、事件需补齐 TSDoc（含 @description/@param/@returns/@throws/@example），任务列表将显式跟踪注释补全。✅
- **技术栈约束原则**：继续使用 Node.js + TypeScript、pnpm、NodeNext；新引入 MikroORM 也遵循 ESM 配置。✅
- **测试要求原则**：单元测试靠近源码目录（已整改）；集成测试位于 `tests/integration`；合约测试保持 `tests/contract`；将新增 CQRS 命令/事件单元测试与 ES 集成测试，覆盖率目标纳入任务。✅
- **配置模块使用规范**：认证/数据库/事件存储等配置统一通过 `@hl8/config` 定义类，`class-validator` 校验，计划中会列明新增配置项。✅
- **日志模块使用规范**：所有命令处理器、守卫、策略、事件处理器统一依赖 `@hl8/logger`，禁止直接引用第三方日志库。✅

## Project Structure

### Documentation (this feature)

```text
specs/002-create-user/
├── plan.md              # 本实现计划
├── research.md          # 架构/技术调研结论（需补充 CQRS、MikroORM、多租户、ES 决策）
├── data-model.md        # 领域实体/聚合/读模型描述
├── quickstart.md        # 本地运行、API 调试、测试指引（将新增数据库/事件存储说明）
├── contracts/           # OpenAPI 契约（用户创建、登录、刷新等）
└── tasks.md             # 任务分解（通过 /speckit.tasks 维护）
```

### Source Code (repository root)

```text
apps/
└── fastify-api/
    ├── src/modules/auth/           # 认证与授权模块（JWT、CASL、CQRS 接入层）
    ├── src/modules/user/           # 用户 API 模块（命令/查询适配层）
    ├── src/modules/cache/          # Redis/内存缓存适配
    ├── test/integration/auth/      # 认证与授权集成测试
    └── test/integration/user/      # 用户模块集成测试

libs/
├── domains/auth/                   # 认证领域包（领域、应用服务、值对象、事件）
├── domains/user/                   # 用户领域包（领域聚合、值对象、领域服务）
├── infra/cache/                    # 缓存能力（含内存兜底）
├── infra/logger|config|async-storage # 公共设施
├── infra/persistence/              # MikroORM PostgreSQL & MongoDB 适配层
└── infra/multi-tenancy/            # CLS、TenantContextExecutor、拦截器、租户感知仓储基类、事件订阅器

tests/
├── contract/auth/                  # OpenAPI 合约测试
└── contract/user/                  # 用户相关契约（预计新增查询接口后扩展）
```

**Structure Decision**: 继续沿用「apps + libs + tests」monorepo 结构；业务领域代码集中在 `libs/domains/*`，Fastify API 仅做适配；MikroORM 持久化层与事件存储由 `libs/infra/persistence/` 维护，`libs/infra/multi-tenancy/` 汇集 CLS、拦截器、仓储基类、事件订阅器及上下文执行器，确保 CQRS/ES 与多租户方案保持一致。

## Complexity Tracking

目前无需记录额外章程违规。所有新增复杂性（CQRS、ES、双数据源）均在章程允许范围内，通过任务拆解控制实现风险。
