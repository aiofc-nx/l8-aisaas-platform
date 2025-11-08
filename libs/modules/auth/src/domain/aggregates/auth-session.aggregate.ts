import { SessionId } from "../value-objects/session-id.vo.js";
import { AccessToken } from "../value-objects/access-token.vo.js";
import { RefreshToken } from "../value-objects/refresh-token.vo.js";
import { AuthSessionStatus } from "../enums/auth-session-status.enum.js";
import { UserId, TenantId } from "@hl8/user";
import { TokenService } from "../../interfaces/token.service.js";
import { AccessTokenPayload } from "../value-objects/access-token-payload.vo.js";
import { RefreshTokenPayload } from "../value-objects/refresh-token-payload.vo.js";

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
  private constructor(private readonly props: AuthSessionProps) {}

  public static async issue(params: {
    userId: UserId;
    tenantId: TenantId;
    roles: string[];
    permissions: string[];
    tokenService: TokenService;
  }): Promise<AuthSession> {
    const sessionId = SessionId.generate();
    const accessPayload = new AccessTokenPayload(
      sessionId,
      params.userId,
      params.tenantId,
      params.roles,
      params.permissions,
    );
    const refreshPayload = new RefreshTokenPayload(
      sessionId,
      params.userId,
      params.tenantId,
    );

    const [accessToken, refreshToken] = await Promise.all([
      params.tokenService.signAccessToken(accessPayload),
      params.tokenService.signRefreshToken(refreshPayload),
    ]);

    return new AuthSession({
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

  public async renewTokens(tokenService: TokenService): Promise<void> {
    this.ensureActive();
    const accessPayload = new AccessTokenPayload(
      this.props.sessionId,
      this.props.userId,
      this.props.tenantId,
      this.props.roles,
      this.props.permissions,
    );
    const refreshPayload = new RefreshTokenPayload(
      this.props.sessionId,
      this.props.userId,
      this.props.tenantId,
    );

    const [accessToken, refreshToken] = await Promise.all([
      tokenService.signAccessToken(accessPayload),
      tokenService.signRefreshToken(refreshPayload),
    ]);

    this.refresh({ accessToken, refreshToken });
    this.props.issuedAt = new Date();
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
}
