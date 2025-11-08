import { Module } from "@nestjs/common";
import { CacheInfrastructureModule } from "@hl8/cache";
import { CacheNamespaceController } from "./cache-namespace.controller.js";
import { CacheConsistencyController } from "./cache-consistency.controller.js";

/**
 * @description 缓存管理模块，聚合命名空间相关控制器。
 */
@Module({
  imports: [CacheInfrastructureModule],
  controllers: [CacheNamespaceController, CacheConsistencyController],
})
export class CacheModule {}
