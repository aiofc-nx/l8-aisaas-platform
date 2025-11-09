import { Inject, Injectable } from "@nestjs/common";
import { Logger } from "@hl8/logger";
import { EmailAddress, UserDomainException } from "@hl8/user";
import { AuthLoggingService } from "./auth-logging.base.js";
import type { AuthSessionRepository } from "../../interfaces/auth-session.repository.js";
import type { TokenService } from "../../interfaces/token.service.js";
import type { TokenPayloadBuilder } from "../../interfaces/token-payload-builder.js";
import type { PasswordHasher } from "../../interfaces/password-hasher.js";
import { LoginCommand } from "../commands/login.command.js";
import { GeneralUnauthorizedException } from "@hl8/exceptions";
import type { AuthAccountRepository } from "../../interfaces/auth-account.repository.js";
import { AuthSession } from "../../domain/aggregates/auth-session.aggregate.js";
import { AuthSessionCreatedDomainEvent } from "../../domain/events/auth-session-created.domain-event.js";
import { TokensRefreshedDomainEvent } from "../../domain/events/tokens-refreshed.domain-event.js";
import {
  AUTH_ACCOUNT_REPOSITORY_TOKEN,
  AUTH_SESSION_REPOSITORY_TOKEN,
  TOKEN_SERVICE_TOKEN,
  PASSWORD_HASHER_TOKEN,
  TOKEN_PAYLOAD_BUILDER_TOKEN,
} from "../../interfaces/auth.tokens.js";

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  sessionId: string;
  userId: string;
  tenantId: string;
  issuedAt: Date;
  events: Array<AuthSessionCreatedDomainEvent | TokensRefreshedDomainEvent>;
}

/**
 * @description 登录应用服务，实现凭证校验与会话签发
 */
@Injectable()
export class LoginService extends AuthLoggingService {
  constructor(
    logger: Logger,
    @Inject(AUTH_ACCOUNT_REPOSITORY_TOKEN)
    private readonly accounts: AuthAccountRepository,
    @Inject(AUTH_SESSION_REPOSITORY_TOKEN)
    private readonly sessions: AuthSessionRepository,
    @Inject(TOKEN_SERVICE_TOKEN)
    private readonly tokenService: TokenService,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_PAYLOAD_BUILDER_TOKEN)
    private readonly tokenPayloadBuilder: TokenPayloadBuilder,
  ) {
    super(logger);
  }

  public async execute(command: LoginCommand): Promise<LoginResult> {
    const email = this.createEmailOrThrow(command.email);

    const account = await this.accounts.findByEmail(email);
    if (!account) {
      this.logger.warn("登录失败，未找到账户", { email: email.value });
      throw new GeneralUnauthorizedException("登录凭证无效");
    }

    const passwordMatches = await this.passwordHasher.compare(
      command.password,
      account.passwordHash,
    );
    if (!passwordMatches) {
      this.logger.warn("登录失败，密码不匹配", {
        userId: account.userId.value,
      });
      throw new GeneralUnauthorizedException("登录凭证无效");
    }

    const session = await AuthSession.issue({
      userId: account.userId,
      tenantId: account.tenantId,
      roles: account.getRoleCodes(),
      permissions: account.getPermissionCodes(),
      tokenService: this.tokenService,
      tokenPayloadBuilder: this.tokenPayloadBuilder,
    });

    await this.sessions.save(session);

    this.logger.log("平台管理员登录成功", {
      userId: session.userId.value,
      sessionId: session.sessionId.value,
    });

    return {
      accessToken: session.accessToken.value,
      refreshToken: session.refreshToken.value,
      accessTokenExpiresAt: session.accessToken.expiresAt,
      refreshTokenExpiresAt: session.refreshToken.expiresAt,
      sessionId: session.sessionId.value,
      userId: session.userId.value,
      tenantId: session.tenantId.value,
      issuedAt: session.issuedAt,
      events: session.pullDomainEvents(),
    };
  }

  private createEmailOrThrow(raw: string): EmailAddress {
    try {
      return EmailAddress.create(raw);
    } catch (error) {
      if (error instanceof UserDomainException) {
        this.logger.warn("邮箱格式无效，拒绝登录", { raw });
        throw new GeneralUnauthorizedException(
          "登录凭证无效",
          undefined,
          error,
        );
      }
      throw error;
    }
  }
}
