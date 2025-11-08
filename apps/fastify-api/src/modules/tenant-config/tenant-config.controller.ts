import { Controller, Get, Param } from "@nestjs/common";
import { TenantConfigService } from "./tenant-config.service.js";

/**
 * @description 提供租户配置缓存查询接口，封装缓存命中逻辑与异常反馈。
 */
@Controller("internal/cache/tenant-config")
export class TenantConfigController {
  constructor(private readonly tenantConfigService: TenantConfigService) {}

  /**
   * @description 根据租户编号拉取最新配置，优先返回缓存数据。
   * @param tenantId 租户唯一标识
   * @returns 租户配置详情，含展示名、更新时间与版本号
   * @throws GeneralBadRequestException 当请求参数缺失或非法时抛出
   */
  @Get(":tenantId")
  async fetchTenantConfiguration(@Param("tenantId") tenantId: string) {
    return this.tenantConfigService.getTenantConfiguration(tenantId);
  }
}
