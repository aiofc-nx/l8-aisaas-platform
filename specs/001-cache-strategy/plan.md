# Implementation Plan: 多层缓存架构方案

**Branch**: `[001-cache-strategy]` | **Date**: 2025-11-07 | **Spec**: ../spec.md
**Input**: Feature specification from `/specs/001-cache-strategy/spec.md`

> **注意**：计划内容必须使用中文撰写，术语需与项目章程保持一致。

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

- 在平台统一的 Redis 集群上，以命名空间隔离多租户缓存，并通过标准化配置、键生成、监控与日志机制，实现缓存共享与隔离兼备的能力。
- 写路径采用“写前删除 + 写后延迟双删 + 失效通知”的一致性策略，结合分布式锁与降级方案，确保数据一致性与高可用。

## Technical Context

**Language/Version**: TypeScript (Node.js ≥20, NodeNext 模块系统)  
**Primary Dependencies**: `@hl8/config`, `@hl8/logger`, `@liaoliaots/nestjs-redis`, `@anchan828/nest-redlock`, `ioredis`, `class-validator`, `nestjs-cls`  
**Storage**: Redis 集群（共享实例、命名空间隔离），底层业务数据仍然在现有数据库中  
**Testing**: Jest + @softkit 测试脚手架（单元）、基于 Fastify/Nest 的集成测试，必要时新增 contract tests  
**Target Platform**: Kubernetes 上运行的 Linux 容器，Fastify/Nest 服务  
**Project Type**: Monorepo 下的多包 Node.js 服务（后端）  
**Performance Goals**: 核心接口 P95 响应时间较无缓存版本降低 ≥30%；缓存命中率维持 ≥85%；写锁等待时间 <200ms（P95）  
**Constraints**: 遵循共享 Redis 实例的资源限制；所有日志与错误消息必须中文；配置需通过 `@hl8/config` 和 `class-validator` 校验；禁止直接使用第三方 Logger  
**Scale/Scope**: 支撑不少于 200 个租户、每日 ≥5 亿次缓存命中、峰值 3 万 QPS 的读请求；写操作需在 1 秒内完成缓存同步

## Constitution Check

- **中文优先原则**：✅ 计划中所有新增注释、日志、错误消息均使用中文；英文变量需补中文注释。
- **代码即文档原则**：✅ 为公共 API、配置类、服务层补充 TSDoc 注释；计划阶段明确责任人及校验点。
- **技术栈约束原则**：✅ 全面采用 Node.js + TypeScript + NodeNext；依赖 pnpm workspace；无 CommonJS。
- **测试要求原则**：✅ 计划覆盖单元、集成、契约测试，并设定覆盖率目标（核心逻辑 ≥80%，关键路径 ≥90%）。
- **配置模块使用规范**：✅ 所有缓存、锁配置均通过 `@hl8/config` 定义配置类并使用 `class-validator` 校验。
- **日志模块使用规范**：✅ 统一通过 `@hl8/logger` 输出日志与告警，无直接使用第三方 Logger。

## Project Structure

### Documentation (this feature)

```text
specs/001-cache-strategy/
├── plan.md              # Implementation plan (当前文件)
├── research.md          # Phase 0 研究结论
├── data-model.md        # Phase 1 数据模型
├── quickstart.md        # Phase 1 快速入门指南
├── contracts/           # Phase 1 API/事件契约
└── tasks.md             # Phase 2 工作拆解（由 /speckit.tasks 生成）
```

### Source Code (repository root)

```text
apps/
├── fastify-api/               # 现有 Fastify 服务，接入缓存客户端与键策略
└── ...

libs/
├── infra/
│   ├── cache/                 # 新建：缓存模块封装（配置类、动态模块、键策略）
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── keys/
│   │   │   ├── services/
│   │   │   ├── locks/
│   │   │   └── index.ts
│   │   └── package.json
│   └── bootstrap/
│       └── ...                # 复用现有启动逻辑
├── shared/
│   └── monitoring/            # 若已有监控事件定义，可在此扩展缓存指标
└── tests/
    ├── unit/
    ├── integration/
    └── contract/
```

**Structure Decision**: 在 `libs/infra/cache` 创建新的缓存基础设施包，供 `apps/fastify-api` 等应用注入使用；监控与告警逻辑复用 `libs/shared/monitoring` 中的统一接口。

## Constitution Check（阶段 1 设计复核）

- 再次确认设计输出（数据模型、契约、快速入门）均落实中文优先、TSDoc 计划、NodeNext 技术栈、测试覆盖要求、配置与日志规范，无新增违规项。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 无 | - | - |
