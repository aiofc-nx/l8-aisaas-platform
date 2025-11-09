import type { ICommand } from "@nestjs/cqrs";

/**
 * @description 创建租户用户命令，承载应用层接收到的请求参数
 */
export class CreateTenantUserCommand implements ICommand {
  constructor(
    /**
     * @description 租户标识
     */
    public readonly tenantId: string,
    /**
     * @description 平台管理员标识
     */
    public readonly createdBy: string,
    /**
     * @description 用户显示名称
     */
    public readonly displayName: string,
    /**
     * @description 平台范围唯一的邮箱
     */
    public readonly email: string,
    /**
     * @description 可选手机号
     */
    public readonly mobile?: string | null,
    /**
     * @description 角色集合，默认包含租户管理员
     */
    public readonly roles?: string[],
  ) {}
}
