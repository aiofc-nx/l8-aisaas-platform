import { AuthSession } from "../domain/aggregates/auth-session.aggregate.js";
import { SessionId } from "../domain/value-objects/session-id.vo.js";

/**
 * @description 认证会话仓储接口
 */
export interface AuthSessionRepository {
  save(session: AuthSession): Promise<void>;

  findBySessionId(sessionId: SessionId): Promise<AuthSession | null>;

  findByRefreshToken(refreshToken: string): Promise<AuthSession | null>;

  revoke(sessionId: SessionId): Promise<void>;
}
