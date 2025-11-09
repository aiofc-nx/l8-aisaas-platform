/**
 * @description 用户状态枚举，对应术语定义中的用户状态分类
 */
export enum UserStatus {
  /**
   * @description 待激活用户：已创建但尚未完成激活流程
   */
  PendingActivation = "pending_activation",
  /**
   * @description 活跃用户：可正常登录并使用系统
   */
  Active = "active",
  /**
   * @description 禁用用户：被管理员手动禁用
   */
  Disabled = "disabled",
  /**
   * @description 锁定用户：因安全策略暂时锁定
   */
  Locked = "locked",
  /**
   * @description 过期用户：授权已过期，需要重新授予
   */
  Expired = "expired",
}
