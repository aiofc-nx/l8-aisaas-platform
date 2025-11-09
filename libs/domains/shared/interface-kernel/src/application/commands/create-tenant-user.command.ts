/**
 * @description 创建租户用户命令，承载应用层接收到的请求参数
 */
export interface CreateTenantUserCommand {
  /**
   * @description 租户标识
   */
  readonly tenantId: string;
  /**
   * @description 平台管理员标识
   */
  readonly createdBy: string;
  /**
   * @description 用户显示名称
   */
  readonly displayName: string;
  /**
   * @description 平台范围唯一的邮箱
   */
  readonly email: string;
  /**
   * @description 可选手机号
   */
  readonly mobile?: string | null;
  /**
   * @description 角色集合，默认包含租户管理员
   */
  readonly roles?: string[];
}
