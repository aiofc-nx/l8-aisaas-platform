# Data Model: 多层缓存架构方案

## 1. CacheConfigurationProfile
- **描述**：表示一个部署环境的缓存整体参数集合。
- **字段**：
  - `environmentKey` (string) — 环境标识，例如 `prod-cn`，需全局唯一。
  - `readyLog` (boolean, default: true) — 是否在客户端就绪时输出中文日志。
  - `errorLog` (boolean, default: true) — 是否在出现错误时输出中文日志。
  - `commonConfig` (RedisCommonConfig | null) — 公共 Redis 客户端设置，覆写单实例默认值。
  - `clients` (RedisClientConfig[]) — 至少一个客户端配置，支持主从、读写分离等场景。
  - `lockSettings` (RedisLockConfig) — Redlock 相应参数。
- **约束**：
  - `clients.length ≥ 1`
  - 如 `commonConfig` 与单个客户端重复字段冲突，以客户端级配置为准。
- **关系**：
  - 关联多个 `CacheNamespacePolicy`（按业务域划分）。

## 2. RedisClientConfig
- **描述**：单个 Redis 实例或节点的连接信息。
- **字段**：
  - `url` (string | null) — 连接 URI，与 host/port 二选一。
  - `host` (string | null) — Redis 主机地址。
  - `port` (number | null) — Redis 端口，0-65535。
  - `namespace` (string | null) — 命名空间基础前缀。
  - `username` (string | null)
  - `password` (string | null)
  - `db` (number, default: 0) — 使用的逻辑库。
  - `keepAlive` / `noDelay` / `connectTimeout` 等（继承自 RedisCommonConfig）。
- **约束**：
  - `url` 和 `host`/`port` 至少满足一种。
  - 字段必须通过 `class-validator` 校验，错误信息使用中文。

## 3. RedisLockConfig
- **描述**：分布式锁相关参数。
- **字段**：
  - `driftFactor` (number, default: 0.01) — Redlock 漂移因子。
  - `retryCount` / `retryDelay` / `retryJitter` (number) — 重试策略。
  - `automaticExtensionThreshold` (number) — 自动续期阈值。
  - `defaultDecoratorLockDuration` (number) — 装饰器默认持锁时间。
- **约束**：
  - 所有数值字段 >= 0。

## 4. CacheNamespacePolicy
- **描述**：定义某业务域的命名与失效策略。
- **字段**：
  - `domain` (string) — 业务域标识（如 `tenant-config`）。
  - `keyPrefix` (string) — 键前缀，结合租户标识构成命名空间。
  - `keySuffix` (string | null) — 键后缀，可选。
  - `separator` (string, default: `:`) — 键分隔符。
  - `defaultTTL` (number) — 默认缓存 TTL（秒）。
  - `evictionPolicy` (enum: `double-delete`, `refresh`, `ttl-only`) — 失效策略。
  - `hitThresholdAlert` (number | null) — 命中率告警阈值。
- **约束**：
  - `keyPrefix` 必须满足命名规范（字母、数字、`-`, `_`）。
  - `defaultTTL > 0`
- **关系**：
  - 指向 `CacheConsistencyRule` 描述写路径行为。

## 5. CacheConsistencyRule
- **描述**：业务写路径的一致性定义。
- **字段**：
  - `domain` (string) — 与 `CacheNamespacePolicy.domain` 对齐。
  - `strategy` (enum: `double-delete`, `write-through`, `ttl-only`) — 主策略。
  - `delayMs` (number) — 延迟删除等待时间（毫秒）。
  - `notificationChannels` (string[]) — 失效通知途径，如 `redis-pubsub`、`event-bus`。
  - `lockEnabled` (boolean) — 是否启用分布式锁。
  - `lockResourceGenerator` (string) — 锁资源键生成规则描述。
- **约束**：
  - 当 `strategy = double-delete` 时，必须配置 `delayMs` 与至少一个通知通道。

## 6. CacheMetricsRecord (逻辑实体)
- **描述**：用于监控上报的指标聚合结构。
- **字段**：
  - `domain` (string)
  - `tenantId` (string)
  - `hitRate` (number)
  - `missCount` (number)
  - `originFetchLatency` (number)
  - `lockWaitP95` (number)
- **用途**：
  - 在监控系统中作为度量点，支持告警与趋势分析。

## 7. 键生成规则（抽象）
- **描述**：`AbstractKeyBuilder` 抽象类及实现。
- **关键方法**：
  - `uniqueIdentifier(payload: unknown): string`
  - `buildKey(parts: string[]): string`
- **约束**：
  - 生成的键不可包含空格及控制字符。
  - 必须记录生成过程中的异常并输出中文警告。
