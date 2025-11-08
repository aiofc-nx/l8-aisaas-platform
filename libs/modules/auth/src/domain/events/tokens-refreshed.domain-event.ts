import { AuthSession } from "../aggregates/auth-session.aggregate.js";

/**
 * @description 令牌刷新领域事件
 */
export class TokensRefreshedDomainEvent {
  private constructor(
    public readonly session: AuthSession,
    public readonly occurredAt: Date,
  ) {}

  public static fromSession(
    session: AuthSession,
    occurredAt: Date = new Date(),
  ): TokensRefreshedDomainEvent {
    return new TokensRefreshedDomainEvent(session, occurredAt);
  }

  public toJSON(): Record<string, unknown> {
    return {
      sessionId: this.session.sessionId.value,
      userId: this.session.userId.value,
      tenantId: this.session.tenantId.value,
      occurredAt: this.occurredAt.toISOString(),
    };
  }
}
