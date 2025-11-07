# Cache Event Contracts

## 1. CacheInvalidatedEvent

- **Channel**: `event-bus.cache.invalidated`
- **Trigger**: 执行写后延迟双删流程时发送，通知其他服务处理失效。
- **Payload**:
  - `eventId` (string, UUID)
  - `emittedAt` (string, ISO8601)
  - `domain` (string)
  - `tenantId` (string)
  - `keys` (string[])
  - `reason` (string, 中文描述)
  - `initiator` (string, 触发来源，如 service 名称)
- **ACK 机制**: 至少一次投递；消费方需幂等处理。

## 2. CacheConsistencyViolationEvent

- **Channel**: `event-bus.cache.violation`
- **Trigger**: 缓存一致性检测发现重复或脏写时上报。
- **Payload**:
  - `eventId` (string)
  - `detectedAt` (string)
  - `domain` (string)
  - `tenantId` (string)
  - `key` (string)
  - `observedVersion` (string)
  - `expectedVersion` (string)
  - `message` (string, 中文详细描述)
- **处理建议**: 运维订阅用于人工介入。

## 3. CacheMetricsSnapshot

- **Channel**: `monitor.cache.snapshot`
- **频率**: 默认 60s 汇总一次。
- **Payload**:
  - `domain` (string)
  - `tenantId` (string)
  - `windowSeconds` (number)
  - `hitRate` (number)
  - `missRate` (number)
  - `avgOriginLatency` (number)
  - `lockWaitP95` (number)
- **用途**: 导入监控平台以满足 Success Criteria 的可观测性要求。
