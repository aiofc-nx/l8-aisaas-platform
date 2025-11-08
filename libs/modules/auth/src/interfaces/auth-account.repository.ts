import { EmailAddress, UserId } from "@hl8/user";
import { AuthAccount } from "../domain/entities/auth-account.entity.js";

/**
 * @description 认证账户仓储接口
 */
export interface AuthAccountRepository {
  findByEmail(email: EmailAddress): Promise<AuthAccount | null>;

  findByUserId(userId: UserId): Promise<AuthAccount | null>;
}
