import { EmailAddress, TenantId, UserId } from "@hl8/user";
import { Role } from "./role.entity.js";

/**
 * @description 认证账户实体，封装登录所需的凭证与权限信息
 */
export class AuthAccount {
  constructor(
    public readonly userId: UserId,
    public readonly tenantId: TenantId,
    public readonly email: EmailAddress,
    public readonly passwordHash: string,
    private readonly roles: Role[],
  ) {}

  public getRoleCodes(): string[] {
    return this.roles.map((role) => role.name);
  }

  public getPermissionCodes(): string[] {
    return this.roles.flatMap((role) =>
      role
        .getPermissions()
        .map((permission) => `${permission.action}:${permission.subject}`),
    );
  }

  public getRoles(): Role[] {
    return [...this.roles];
  }
}
