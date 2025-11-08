import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import {
  CacheConsistencyService,
  CacheNotificationService,
  CachePrefetchNotification,
  CacheInvalidationCommand,
} from "@hl8/cache";
import { randomUUID } from "node:crypto";
import { InvalidateCacheDto } from "./dto/invalidate-cache.dto.js";
import { PrefetchRequestDto } from "./dto/prefetch-request.dto.js";

/**
 * @description 写路径一致性控制器，封装失效与预热接口。
 */
@Controller("internal/cache")
export class CacheConsistencyController {
  constructor(
    private readonly cacheConsistencyService: CacheConsistencyService,
    private readonly cacheNotificationService: CacheNotificationService,
  ) {}

  /**
   * @description 触发缓存失效流程，执行延迟双删并发送通知。
   * @param dto 失效请求体
   * @returns 请求标识与计划执行时间
   */
  @Post("invalidations")
  @HttpCode(HttpStatus.ACCEPTED)
  public async invalidateCache(@Body() dto: InvalidateCacheDto) {
    const requestId = randomUUID();
    const command: CacheInvalidationCommand = {
      domain: dto.domain,
      tenantId: dto.tenantId,
      keys: dto.keys,
      delayMs: dto.delayMs,
      lockDurationMs: dto.lockDurationMs,
      notify: dto.notify ?? true,
      clientKey: dto.clientKey,
      reason: dto.reason,
    };

    await this.cacheConsistencyService.invalidate(command);

    return {
      requestId,
      scheduledAt: new Date().toISOString(),
    };
  }

  /**
   * @description 发送缓存预热通知，供下游服务执行刷新。
   * @param dto 预热参数
   * @returns 刷新统计结果
   */
  @Post("prefetch")
  @HttpCode(HttpStatus.OK)
  public async prefetchCache(@Body() dto: PrefetchRequestDto) {
    const payload: CachePrefetchNotification = {
      domain: dto.domain,
      tenantId: dto.tenantId,
      keys: dto.keys,
      bypassLock: dto.bypassLock,
    };
    return this.cacheNotificationService.publishPrefetchRequested(payload);
  }
}
