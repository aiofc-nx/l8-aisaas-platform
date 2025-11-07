# @hl8/cache

## 功能概述

- 提供 Redis 客户端与 Redlock 模块的统一引导，遵循 `@hl8/config` 与 `@hl8/exceptions` 的运行规范。
- 定义标准化的缓存键生成器、命中率监控钩子以及缓存读服务，默认采用 JSON 序列化策略。
- 暴露命名空间策略注册表与查询服务，支持按业务域维护键前缀、TTL 与失效策略。
- 通过常量导出缓存默认分隔符、租户配置域名与默认 TTL，避免多处硬编码。

## 快速上手

```ts
import { Module } from "@nestjs/common";
import { CacheInfrastructureModule } from "@hl8/cache";

@Module({
  imports: [CacheInfrastructureModule],
})
export class TenantConfigModule {}
```

在业务服务中可直接注入 `CacheReadService` 与对应的键生成器，默认会以 JSON 序列化缓存数据，并记录命中、回源与失败指标。

## 缓存读写与序列化策略

- `CacheReadService.getOrLoad` 默认使用 `serializeToJson` 与 `deserializeFromJson` 序列化函数（也可从 `@hl8/cache` 导入自定义复用）。
- 通过 `CacheReadOptions` 的 `serialize` / `deserialize` 选项即可覆盖默认策略，实现如 `msgpack`、`protobuf` 等定制格式。
- 发生反序列化错误时会触发 `CacheMetricsHook.recordFailure` 并抛出 `GeneralInternalServerException`，便于统一治理。

示例：

```ts
await this.cacheReadService.getOrLoad<UserProfile>({
  domain: "user-profile",
  key,
  loader: () => this.profileRepository.load(userId),
  serialize: (value) => msgpack.encode(value).toString("base64"),
  deserialize: (payload) => msgpack.decode(Buffer.from(payload, "base64")) as UserProfile,
});
```

## 命名空间配置与常量

- `CacheNamespacePolicyConfig` 用于定义域名、键前缀、默认 TTL 与失效策略，默认键分隔符由 `DEFAULT_CACHE_KEY_SEPARATOR` 提供。
- `CacheNamespaceRegistry` 会根据配置生成快照并支持热更新通知，`CacheNamespaceService` 则提供对外查询视图。
- 常用常量：
  - `DEFAULT_CACHE_KEY_SEPARATOR`：缓存键分隔符（默认为 `:`）。
  - `TENANT_CONFIG_CACHE_DOMAIN`：租户配置缓存域标识。
  - `TENANT_CONFIG_CACHE_TTL_SECONDS`：租户配置缓存默认 TTL（秒）。

命名空间策略示例：

```ts
const config = new CacheConfig();
const tenantPolicy = new CacheNamespacePolicyConfig();
tenantPolicy.domain = TENANT_CONFIG_CACHE_DOMAIN;
tenantPolicy.keyPrefix = "tc";
tenantPolicy.defaultTTL = TENANT_CONFIG_CACHE_TTL_SECONDS;
tenantPolicy.evictionPolicy = CacheEvictionPolicy.DoubleDelete;

config.namespacePolicies = [tenantPolicy];
```

## 测试与契约

- `tests/` 目录包含 OpenAPI 契约测试（依赖 `tests/jest.config.ts` 与 `tsconfig.contract.json`）。
- Fastify 集成测试位于 `apps/fastify-api/test/integration/cache/`，覆盖命名空间接口与租户配置缓存回归场景。
