/**
 * @description 用户角色枚举，表示用户在租户内的最小权限集合
 */
export enum UserRole {
  /**
   * @description 租户管理员：拥有租户级别配置与用户管理权限
   */
  TenantAdmin = "tenant-admin",
}
