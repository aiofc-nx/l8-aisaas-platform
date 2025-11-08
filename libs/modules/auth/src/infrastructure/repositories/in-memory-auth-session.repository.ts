import { AuthSessionRepository } from "../../interfaces/auth-session.repository.js";
import { AuthSession } from "../../domain/aggregates/auth-session.aggregate.js";
import { SessionId } from "../../domain/value-objects/session-id.vo.js";
import { RefreshToken } from "../../domain/value-objects/refresh-token.vo.js";
import { AuthSessionStatus } from "../../domain/enums/auth-session-status.enum.js";

/**
 * @description 内存会话仓储，便于测试与本地开发
 */
export class InMemoryAuthSessionRepository implements AuthSessionRepository {
  private readonly items = new Map<string, AuthSession>();

  public async save(session: AuthSession): Promise<void> {
    this.items.set(session.sessionId.value, session);
  }

  public async findBySessionId(
    sessionId: SessionId,
  ): Promise<AuthSession | null> {
    const session = this.items.get(sessionId.value);
    if (!session) {
      return null;
    }
    return session.status === AuthSessionStatus.Active ? session : null;
  }

  public async findByRefreshToken(token: string): Promise<AuthSession | null> {
    for (const session of this.items.values()) {
      if (
        session.status === AuthSessionStatus.Active &&
        session.refreshToken.value === token
      ) {
        return session;
      }
    }
    return null;
  }

  public async revoke(sessionId: SessionId): Promise<void> {
    this.items.delete(sessionId.value);
  }

  public clear(): void {
    this.items.clear();
  }
}
