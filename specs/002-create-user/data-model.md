# Data Model · 用户管理与认证模块

## 聚合：User

| 字段          | 类型                         | 说明                                                           | 校验规则                            |
| ------------- | ---------------------------- | -------------------------------------------------------------- | ----------------------------------- |
| `userId`      | `UserId` (UUID 值对象)       | 平台全局唯一标识，由领域层生成                                 | 必填，UUID v4                       |
| `tenantId`    | `TenantId` (UUID 值对象)     | 租户标识，与租户聚合建立外键关系                               | 必填，UUID v4                       |
| `displayName` | `DisplayName` 值对象         | 中文姓名或姓名拼音，展示在管理后台                             | 必填，长度 1~50，去除首尾空格       |
| `email`       | `EmailAddress` 值对象        | 平台范围唯一的邮箱地址                                         | 必填，RFC 5322 基本格式，统一转小写 |
| `mobile`      | `MobilePhone` 值对象 \| null | 可选手机号，用于二次验证或通知                                 | 可选，中国大陆号码正则 `^1\d{10}$`  |
| `status`      | `UserStatus` 枚举            | 用户状态（活跃、待激活、禁用、锁定、过期），与术语定义保持一致 | 创建时默认为 `待激活`               |
| `roles`       | `UserRole[]`                 | 初始包含 `tenant-admin`，未来可扩展角色集                      | 数组非空，枚举值受控                |
| `createdAt`   | `Date`                       | 创建时间戳                                                     | 由领域事件带出，应用层设置          |
| `createdBy`   | `PlatformAdminId` 值对象     | 创建该账户的平台管理员                                         | 必填，UUID v4                       |

### 状态转换

- `待激活 → 活跃`：后续激活流程处理，不在本迭代范围内。
- `待激活/活跃 → 锁定/禁用`：由安全策略或管理员操作触发，暂未实现。
- `活跃 → 过期`：由权限到期流程触发，暂未实现。

本迭代仅涉及初始写入（`待激活`），不生成其他状态迁移。

### 行为与不变式

- `User.create()`：构造聚合根并执行所有值对象校验；若参数非法抛出领域异常。
- `User.assignRoles()`：用于未来扩展多角色；当前默认注入 `tenant-admin`。
- 不变式：`email` 在平台级查重；`roles` 至少包含一个业务角色。

## 聚合：AuthSession（认证会话）

| 字段              | 类型                     | 说明                                   | 校验规则          |
| ----------------- | ------------------------ | -------------------------------------- | ----------------- |
| `sessionId`       | `SessionId` 值对象       | 会话标识，刷新令牌与访问令牌的逻辑绑定 | 必填，UUID v4     |
| `userId`          | `UserId`                 | 对应用户标识                           | 必填              |
| `tenantId`        | `TenantId`               | 对应租户标识                           | 必填              |
| `accessToken`     | `AccessToken` 值对象     | 访问令牌字符串 + 过期时间              | 必填，长度 <= 7kb |
| `refreshToken`    | `RefreshToken` 值对象    | 刷新令牌字符串 + 过期时间              | 必填，长度 <= 7kb |
| `issuedAt`        | `Date`                   | 颁发时间                               | 必填              |
| `lastRefreshedAt` | `Date \| null`           | 最近刷新时间                           | 可选              |
| `status`          | `AuthSessionStatus` 枚举 | 正常 / 吊销 / 过期                     | 初始为 `Active`   |

### 行为

- `AuthSession.refresh()`：生成新的访问/刷新令牌，更新 `lastRefreshedAt`。
- `AuthSession.revoke()`：将状态标记为吊销并记录原因。
- 不变式：刷新令牌每次使用后必须轮换；被吊销的会话不可再次刷新。

## 实体：Role / Permission

| 实体         | 字段                   | 说明                              |
| ------------ | ---------------------- | --------------------------------- |
| `Role`       | `roleId`、`name`       | 角色唯一名称（如 `tenant-admin`） |
|              | `permissions`          | 与 `Permission` 的多对多关系      |
| `Permission` | `permissionId`、`name` | 权限描述，例如 `User.ReadAny`     |
|              | `action` / `subject`   | CASL 所需 Action/Subject 枚举值   |

角色数据将在登录时通过仓储加载，`CaslAbilityFactory` 依赖该信息构建能力。

## 值对象

- `EmailAddress`：负责邮箱正则校验、去除空格、统一小写。
- `DisplayName`：校验长度与非法字符，防止脚本注入。
- `MobilePhone`：负责手机号正则校验，可缺省。
- `UserId` / `TenantId` / `PlatformAdminId` / `SessionId`：封装 UUID 校验与生成。
- `AccessToken` / `RefreshToken`：封装令牌字符串、过期时间、原始 payload，提供长度检测。
- `AuthConfig`：访问令牌秘钥、刷新令牌秘钥、过期时间、Header 名称及租户 Header。

## 仓储接口

```ts
interface UserRepository {
  findByEmail(email: EmailAddress): Promise<User | null>;
  save(user: User): Promise<void>;
  findById(userId: UserId): Promise<User | null>;
}

interface AuthSessionRepository {
  save(session: AuthSession): Promise<void>;
  findByRefreshToken(token: RefreshToken): Promise<AuthSession | null>;
  revoke(sessionId: SessionId): Promise<void>;
}

interface UserProjectionRepository {
  upsert(projection: UserProjection): Promise<void>;
  findByTenant(tenantId: TenantId): Promise<UserProjection[]>;
  findByEmail(email: EmailAddress): Promise<UserProjection | null>;
}

interface DomainEventStore {
  append(event: DomainEvent): Promise<void>;
  load(aggregateId: string): Promise<DomainEvent[]>;
}
```

- 命令侧仓储（`UserRepository`、`AuthSessionRepository`）将使用 MikroORM + PostgreSQL 实现，保留内存实现方便测试；
- 查询侧投影（`UserProjectionRepository`）初期可使用 PostgreSQL/materialized view，后续可扩展 Redis；
- `DomainEventStore` 使用 MikroORM + MongoDB 记录事件流，支持事件重放与审计；
- 现有内存实现仍作为开发与测试兜底。

## 读模型（UserProjection）

| 字段          | 类型            | 说明                                   |
| ------------- | --------------- | -------------------------------------- |
| `id`          | `string` (UUID) | 对应领域 `UserId`                      |
| `tenantId`    | `string` (UUID) | 对应租户标识                           |
| `email`       | `string`        | 去重查询索引                           |
| `displayName` | `string`        | 展示姓名                               |
| `roles`       | `string[]`      | 扁平化角色列表                         |
| `status`      | `UserStatus`    | 当前用户状态                           |
| `createdAt`   | `Date`          | 创建时间                               |
| `updatedAt`   | `Date`          | 最后一次投影更新时间（事件处理器维护） |

- 事件处理器在捕获 `UserCreatedDomainEvent`、`UserRolesUpdatedEvent` 等事件时，写入或更新 PostgreSQL 读模型表；
- 查询侧 Handler 通过 `UserProjectionRepository` 返回读模型 DTO，避免直接暴露领域实体。

## 事件流模型

| 字段          | 类型     | 说明                             |
| ------------- | -------- | -------------------------------- |
| `eventId`     | `string` | MongoDB `_id` / UUID             |
| `aggregateId` | `string` | 对应 `UserId`                    |
| `type`        | `string` | 事件类型（如 `UserCreated`）     |
| `version`     | `number` | 事件版本，支持并发控制           |
| `payload`     | `object` | 业务数据（JSON）                 |
| `occurredOn`  | `Date`   | 事件发生时间                     |
| `metadata`    | `object` | 上下文（tenantId、requestId 等） |

- 事件写入 MongoDB 集合 `user_events`，使用索引 `(aggregateId, version)`；
- 事件处理器读取事件用于投影更新与审计；
- 未来支持通过事件快照恢复聚合，当前迭代仅记录日志供审计。

## CASL 能力建模

- `Actions` 枚举参考 nestjs-saas（`Read`/`ReadOwn`/`ReadAny` 等）。
- `Subjects` 枚举覆盖 `User`、`Role`
