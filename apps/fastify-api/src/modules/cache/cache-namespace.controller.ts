import { Controller, Get } from "@nestjs/common";
import { CacheNamespacePolicyView, CacheNamespaceService } from "@hl8/cache";

/**
 * @description 缓存命名空间管理控制器，提供策略查询接口。
 */
@Controller("internal/cache/namespaces")
export class CacheNamespaceController {
  constructor(private readonly cacheNamespaceService: CacheNamespaceService) {}

  /**
   * @description 查询全部命名空间策略。
   * @returns 包含策略数组的响应对象
   */
  @Get()
  public listPolicies(): { data: CacheNamespacePolicyView[] } {
    const data = this.cacheNamespaceService.listPolicies();
    return { data };
  }
}
