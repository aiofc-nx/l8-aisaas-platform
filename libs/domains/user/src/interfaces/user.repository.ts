import type { EmailAddress } from "../domain/value-objects/email-address.vo.js";
import type { User } from "../domain/aggregates/user.aggregate.js";

/**
 * @description 用户仓储接口，定义持久化操作契约
 */
export interface UserRepository {
  /**
   * @description 根据邮箱查询用户
   * @param email 平台范围唯一邮箱
   * @returns 匹配的用户或 null
   */
  findByEmail(email: EmailAddress): Promise<User | null>;

  /**
   * @description 持久化用户聚合
   * @param user 用户聚合实例
   */
  save(user: User): Promise<void>;
}
