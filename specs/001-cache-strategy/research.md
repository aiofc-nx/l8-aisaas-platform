# Research Notes: 多层缓存架构方案

## 决策汇总

### 决策 1：共享 Redis 集群并按命名空间隔离
- **Rationale**：集中管理可降低运维成本，便于跨租户共享资源；结合命名空间与键前缀即可实现逻辑隔离，同时利用 Redis 内部统计实现统一监控。
- **Alternatives Considered**：
  - 独立集群：隔离性最好但成本高，资源利用率低。
  - 混合部署：复杂度高，需要额外调度策略。

### 决策 2：写路径采用“写前删除 + 写后延迟双删 + 失效通知”
- **Rationale**：延迟双删可处理数据库事务延迟导致的旧值回写问题；通过失效通知（Redis Pub/Sub 或事件总线）让其他实例及时更新，兼顾一致性与命中率。
- **Alternatives Considered**：
  - 纯 TTL：删除过慢，命中率下降。
  - 写后立即刷新：并发下存在脏写风险且开销大。

### 决策 3：统一配置类 + `@hl8/config` 管理多实例
- **Rationale**：遵循章程并复用 Softkit Redis 模块经验；通过 `class-validator` 确保参数安全，避免配置漂移。
- **Alternatives Considered**：
  - 手写配置解析：缺乏校验，维护成本高。
  - 直接使用环境变量：不符合章程且不易扩展。

### 决策 4：Redlock 作为分布式锁实现
- **Rationale**：Redlock 经业界验证且与 `@anchan828/nest-redlock` 集成顺畅；支持自动延期、超时重试。
- **Alternatives Considered**：
  - 基于 Lua 脚本自建锁：需要额外维护、验证。
  - 数据库悲观锁：性能不足且与缓存解耦。

### 决策 5：监控指标覆盖命中率、回源率、锁等待
- **Rationale**：便于评估缓存价值与异常诊断，符合 Success Criteria 的量化要求。
- **Alternatives Considered**：
  - 仅记录命中率：无法定位写入延迟与锁争用问题。
  - 不记录：运维无法追踪问题源头。
