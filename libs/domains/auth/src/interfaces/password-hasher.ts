/**
 * @description 密码哈希接口，封装 compare 行为以便替换实现
 */
export interface PasswordHasher {
  compare(plain: string, hashed: string): Promise<boolean>;
}
