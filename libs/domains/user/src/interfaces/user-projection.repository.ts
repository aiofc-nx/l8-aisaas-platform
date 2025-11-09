import type { UserStatus } from "../domain/enums/user-status.enum.js";

/**
 * @description 用户读模型数据结构
 */
export interface UserProjection {
  /**
   * @description 用户唯一标识
   */
  id: string;
  /**
   * @description 所属租户标识
   */
  tenantId: string;
  /**
   * @description 展示名称
   */
  displayName: string;
  /**
   * @description 邮箱
   */
  email: string;
  /**
   * @description 当前状态
   */
  status: UserStatus;
  /**
   * @description 角色列表
   */
  roles: string[];
  /**
   * @description 创建时间
   */
  createdAt: Date;
  /**
   * @description 最近更新时间
   */
  updatedAt: Date;
}

/**
 * @description 用户读模型仓储接口
 */
export const USER_PROJECTION_REPOSITORY = Symbol("USER_PROJECTION_REPOSITORY");

export interface UserProjectionRepository {
  /**
   * @description 覆盖或插入读模型
   * @param projection 读模型数据
   */
  upsert(projection: UserProjection): Promise<void>;
}
