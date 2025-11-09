import { SessionId } from "../value-objects/session-id.vo.js";
import { AccessToken } from "../value-objects/access-token.vo.js";
import { RefreshToken } from "../value-objects/refresh-token.vo.js";
import { AuthSessionStatus } from "../enums/auth-session-status.enum.js";
import { UserId, TenantId } from "@hl8/user";
import { TokenService } from "../../interfaces/token.service.js";
import { TokenPayloadBuilder } from "../../interfaces/token-payload-builder.js";
import { AuthSessionCreatedDomainEvent } from "../events/auth-session-created.domain-event.js";
import { TokensRefreshedDomainEvent } from "../events/tokens-refreshed.domain-event.js";

export interface AuthSessionProps {
  sessionId: SessionId;
  userId: UserId;
  tenantId: TenantId;
  accessToken: AccessToken;
  refreshToken: RefreshToken;
  issuedAt: Date;
  lastRefreshedAt?: Date | null;
  status: AuthSessionStatus;
  roles: string[];
  permissions: string[];
}

/**
 * @description 认证会话聚合，管理访问/刷新令牌生命周期
 */
export class AuthSession {
  private readonly domainEvents: Array<
    AuthSessionCreatedDomainEvent | TokensRefreshedDomainEvent
  > = [];

  private constructor(private readonly props: AuthSessionProps) {}

  public static restore(props: AuthSessionProps): AuthSession {
    return new AuthSession({ ...props });
  }

  public static async issue(params: {
    userId: UserId;
    tenantId: TenantId;
    roles: string[];
    permissions: string[];
    tokenService: TokenService;
    tokenPayloadBuilder: TokenPayloadBuilder;
  }): Promise<AuthSession> {
    const sessionId = SessionId.generate();
    const accessPayload = params.tokenPayloadBuilder.buildAccessPayload({
      sessionId,
      userId: params.userId,
      tenantId: params.tenantId,
      roles: params.roles,
      permissions: params.permissions,
    });
    const refreshPayload = params.tokenPayloadBuilder.buildRefreshPayload({
      sessionId,
      userId: params.userId,
      tenantId: params.tenantId,
    });

    const [accessToken, refreshToken] = await Promise.all([
      params.tokenService.signAccessToken(accessPayload),
      params.tokenService.signRefreshToken(refreshPayload),
    ]);

    const session = new AuthSession({
      sessionId,
      userId: params.userId,
      tenantId: params.tenantId,
      accessToken,
      refreshToken,
      issuedAt: new Date(),
      lastRefreshedAt: null,
      status: AuthSessionStatus.Active,
      roles: [...params.roles],
      permissions: [...params.permissions],
    });

    session.recordEvent(AuthSessionCreatedDomainEvent.fromSession(session));

    return session;
  }

  public refresh(tokens: {
    accessToken: AccessToken;
    refreshToken: RefreshToken;
  }): void {
    this.ensureActive();
    this.props.accessToken = tokens.accessToken;
    this.props.refreshToken = tokens.refreshToken;
    this.props.lastRefreshedAt = new Date();
  }

  public async renewTokens(
    tokenService: TokenService,
    tokenPayloadBuilder: TokenPayloadBuilder,
  ): Promise<void> {
    this.ensureActive();
    const accessPayload = tokenPayloadBuilder.buildAccessPayload({
      sessionId: this.props.sessionId,
      userId: this.props.userId,
      tenantId: this.props.tenantId,
      roles: this.props.roles,
      permissions: this.props.permissions,
    });
    const refreshPayload = tokenPayloadBuilder.buildRefreshPayload({
      sessionId: this.props.sessionId,
      userId: this.props.userId,
      tenantId: this.props.tenantId,
    });

    const [accessToken, refreshToken] = await Promise.all([
      tokenService.signAccessToken(accessPayload),
      tokenService.signRefreshToken(refreshPayload),
    ]);

    this.refresh({ accessToken, refreshToken });
    this.props.issuedAt = new Date();
    this.recordEvent(TokensRefreshedDomainEvent.fromSession(this));
  }

  public revoke(): void {
    if (this.props.status === AuthSessionStatus.Revoked) {
      return;
    }
    this.props.status = AuthSessionStatus.Revoked;
  }

  private ensureActive(): void {
    if (this.props.status !== AuthSessionStatus.Active) {
      throw new Error("会话已失效，无法刷新令牌");
    }
  }

  public get sessionId(): SessionId {
    return this.props.sessionId;
  }

  public get userId(): UserId {
    return this.props.userId;
  }

  public get tenantId(): TenantId {
    return this.props.tenantId;
  }

  public get roles(): string[] {
    return [...this.props.roles];
  }

  public get permissions(): string[] {
    return [...this.props.permissions];
  }

  public get accessToken(): AccessToken {
    return this.props.accessToken;
  }

  public get refreshToken(): RefreshToken {
    return this.props.refreshToken;
  }

  public get issuedAt(): Date {
    return this.props.issuedAt;
  }

  public get lastRefreshedAt(): Date | null | undefined {
    return this.props.lastRefreshedAt;
  }

  public get status(): AuthSessionStatus {
    return this.props.status;
  }

  public pullDomainEvents(): Array<
    AuthSessionCreatedDomainEvent | TokensRefreshedDomainEvent
  > {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }

  private recordEvent(
    event: AuthSessionCreatedDomainEvent | TokensRefreshedDomainEvent,
  ): void {
    this.domainEvents.push(event);
  }
}
