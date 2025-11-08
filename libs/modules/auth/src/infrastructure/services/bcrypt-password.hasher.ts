import { compare, hash } from "bcryptjs";
import { PasswordHasher } from "../../interfaces/password-hasher.js";

/**
 * @description 使用 bcryptjs 实现的密码哈希器
 */
export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly saltRounds: number = 12) {}

  public async compare(plain: string, hashed: string): Promise<boolean> {
    if (!plain || !hashed) {
      return false;
    }
    return compare(plain, hashed);
  }

  /**
   * @description 生成密码哈希（用于种子数据或管理后台重置密码）
   */
  public async hash(plain: string): Promise<string> {
    return hash(plain, this.saltRounds);
  }
}
