import { Permission } from "./permission.entity.js";

/**
 * @description 角色实体，聚合权限列表
 */
export class Role {
  constructor(
    public readonly roleId: string,
    public readonly name: string,
    private readonly permissions: Permission[],
  ) {}

  public getPermissions(): Permission[] {
    return [...this.permissions];
  }
}
