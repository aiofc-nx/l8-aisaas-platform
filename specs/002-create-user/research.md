# Research Log · 用户管理与认证模块

## 决策 1：邮箱在平台范围内保持唯一，并在冲突时返回业务错误

- **Decision**: 在创建用户时对邮箱执行平台级唯一性校验；若已存在，则返回中文错误消息并终止流程，不触发邀请/加入逻辑。
- **Rationale**: 平台用户即系统中的“基础身份”，复用同一邮箱会导致跨租户身份不清晰；当前迭代聚焦首个租户用户的创建，不引入邀请流程可降低复杂度。
- **Alternatives considered**:
  - 仅在租户内校验唯一性：会造成同一邮箱在平台层面重复，后续权限聚合复杂。
  - 邮箱冲突时触发邀请：实现成本高，且与本迭代目标（首个用户的快速创建）不符。

## 决策 2：采用 DDD + Clean Architecture 结构，新增 `libs/modules/user`

- **Decision**: 在 monorepo 中新增 `libs/modules/user`，拆分 `domain`、`application`、`infrastructure`、`interfaces` 层；Fastify 模块通过应用服务暴露 REST API。
- **Rationale**: 项目章程要求 DDD + Clean Architecture；建立独立包可复用至后续 Bounded Context 并利于单元测试。
- **Alternatives considered**:
  - 将逻辑直接放在 `apps/fastify-api` 中：不利于复用且违反分层约束。
  - 在现有 `libs/infra` 中扩展：`infra` 侧重基础能力，与业务领域职责不符。

## 决策 3：仓储接口面向 PostgreSQL，当前迭代提供内存实现 + 测试桩

- **Decision**: 定义 `UserRepository` 接口，约定未来通过 PostgreSQL 实现；本迭代提供内存仓储与契约测试支撑 API 开发。
- **Rationale**: docker-compose 已包含 PostgreSQL，后续真实实现可直接衔接；当前迭代目标是完成 API 与领域模型，可先以内存实现保证用例与测试落地。
- **Alternatives considered**:
  - 立即接入 ORM：缺少既有基线，短期内会拉长迭代时间。
  - 使用 Redis 作为主存储：不适合账户类持久化需求，且不满足事务一致性。

## 决策 4：认证模块采用 TokenBuilder + TokenService 组合

- **Decision**: 借鉴 `forks/softkit-core/libs/infra/auth` 的设计，将 Token 构造与签名拆分为 `AbstractTokenBuilderService`（聚合业务所需 payload）与 `TokenService`（负责签名、校验、长度告警），并统一使用 `@hl8/logger` 输出中文日志。
- **Rationale**: Softkit 核心实现验证了该分层在多租户场景的可维护性；拆分后可在不同场景复用 payload 组装逻辑，同时满足日志、安全校验需求。
- **Alternatives considered**:
  - 在控制器中直接调用 `JwtService`：难以复用，且无法集中处理日志、长度告警。
  - 仅提供单一 TokenService：扩展不同 payload 时需频繁修改服务，违背开放封闭原则。

## 决策 5：授权模块对齐 nestjs-saas-tenant-boilerplate 的 CASL 模式

- **Decision**: 采用 `CaslAbilityFactory` + `PoliciesGuard` + `@CheckPolicies` 装饰器的组合，能力由用户角色权限映射生成；策略处理器支持类和函数两种形式，复用 OWN/ANY 判定，并与 CLS 集成。
- **Rationale**: nestjs-saas-tenant-boilerplate 中的实践证明了该结构在多租户 SaaS 场景下的可扩展性；CASL 能力可持续扩展新的 Action/Subject；策略处理器结合请求上下文可实现细粒度控制。
- **Alternatives considered**:
  - 仅在控制器中硬编码权限判断：难以维护与复用。
  - 使用 Nest 自带 `RolesGuard`：无法覆盖 OWN/ANY、Presence 等复杂规则。

## 决策 6：MikroORM 统一持久化层，区分 PostgreSQL 与 MongoDB 驱动

- **Decision**: 采用 MikroORM 作为 ORM 框架，命令侧实体（用户、角色、权限、会话等）使用 PostgreSQL 驱动存储，事件溯源与审计日志使用 MongoDB 驱动，二者通过 MikroORM 的多数据源配置集中管理。
- **Rationale**: `forks/nestjs-saas-tenant-boilerplate` 展示了 MikroORM 在 NestJS 中的模块化集成、租户订阅器和迁移流程，可直接复用其配置组织、仓储注入、唯一值校验实践；MikroORM 6 原生支持多驱动，便于未来切换或扩展；PostgreSQL 满足事务一致性，MongoDB 适合事件存储的时间序列写入。
- **Alternatives considered**:
  - TypeORM：与 NodeNext/ESM 兼容性相对较差，多驱动配置复杂，且现有参考项目使用 MikroORM；
  - Prisma：对事件溯源和复杂聚合支持不足，且不易实现细粒度仓储接口。

## 决策 7：引入 `@nestjs/cqrs` 实现命令查询职责分离

- **Decision**: 在应用层引入 `@nestjs/cqrs`，所有写操作封装为命令（Command + CommandHandler），读操作封装为查询（Query + QueryHandler），事件处理（EventHandler）用于广播领域事件并写入投影。命令侧调用领域服务与 MikroORM PostgreSQL 仓储，查询侧读取聚合投影（可直接访问 PostgreSQL 或后续缓存层）。
- **Rationale**: CQRS 可与现有 DDD/ES 模式自然协作，`@nestjs/cqrs` 提供装饰器、总线、模块注册的基础设施；forks 项目同样使用 CQRS 思想组织服务层，可借鉴其 Module 与 Handler 注册方式。
- **Alternatives considered**:
  - 继续使用传统 Service 模式：读写耦合，后续引入事件溯源时难以扩展；
  - 自行实现事件总线：重复造轮子，缺乏 Nest 官方生态支持。

## 决策 8：结合事件溯源（ES）记录用户域事件

- **Decision**: 用户聚合在命令执行后发布领域事件（如 `UserCreatedDomainEvent`），事件既写入 MongoDB 事件存储，也通过 CQRS 的 EventHandler 转成读模型投影。事件实体设计将参考 nestjs-saas-tenant-boilerplate 的订阅器模式，并结合 MikroORM 的 `EventSubscriber` 保证租户上下文落地。
- **Rationale**: 事件溯源可追踪用户生命周期、支持审计与补偿；MongoDB 高效写入文档型事件；现有领域模型已发布事件，扩展事件存储只需新增处理器。
- **Alternatives considered**:
  - 仅记录审计日志：难以重放与恢复状态；
  - 将事件存储在 PostgreSQL：结构化模式受限，重放效率偏低。

## 决策 9：JWT 守卫与多租户上下文使用 CLS

- **Decision**: 仿照 softkit 核心与 nestjs-saas-tenant-boilerplate，将 JWT 守卫或策略中解析出的用户、租户信息写入 CLS（`@hl8/async-storage`），同时保留 `@SkipAuth` 装饰器用于开放接口。
- **Rationale**: CLS 可在日志、CASL 策略、数据库订阅等场景共享上下文；软引用项目已证明该方式能兼容异步链路。
- **Alternatives considered**:
  - 不使用 CLS：需要在调用链中显式传递租户/用户 ID，增加耦合。
  - 仅在请求对象上附加：无法跨越服务层/事件处理器。

## 决策 10：权限与角色实体化，权限来源于数据库

- **Decision**: 参考 nestjs-saas-tenant-boilerplate，引入 `Role`、`Permission` 实体，并在 JWT 策略加载用户时预先填充角色权限集合，CASL 直接从实体生成规则。
- **Rationale**: 权限可持久化并通过后台配置，扩展新角色时无需修改代码；与 CASL 枚举结合可快速定位授权问题。
- **Alternatives considered**:
  - 权限写死在代码中：调整权限需要重新发布代码，难以应对租户自定义需求。
  - 在 JWT 负载中传递完整权限：令牌过大、冲突管理复杂。
