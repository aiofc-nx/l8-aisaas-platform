import type { EmailAddress } from "../../domain/value-objects/email-address.vo.js";
import type { User } from "../../domain/aggregates/user.aggregate.js";
import { UserRepository } from "../../interfaces/user.repository.js";

/**
 * @description 简单的内存仓储实现，仅用于单元与集成测试
 */
export class InMemoryUserRepository implements UserRepository {
  private readonly usersByEmail = new Map<string, User>();

  public async findByEmail(email: EmailAddress): Promise<User | null> {
    return this.usersByEmail.get(email.value) ?? null;
  }

  public async save(user: User): Promise<void> {
    const email = user.email.value;
    this.usersByEmail.set(email, user);
  }

  /**
   * @description 测试辅助方法，清空所有数据
   */
  public clear(): void {
    this.usersByEmail.clear();
  }
}
