import { Inject, Injectable } from "@nestjs/common";
import { Logger } from "@hl8/logger";
import { AuthLoggingService } from "./auth-logging.base.js";
import type { AuthSessionRepository } from "../../interfaces/auth-session.repository.js";
import type { TokenService } from "../../interfaces/token.service.js";
import type { TokenPayloadBuilder } from "../../interfaces/token-payload-builder.js";
import { RefreshCommand } from "../commands/refresh.command.js";
import { GeneralUnauthorizedException } from "@hl8/exceptions";
import {
  AUTH_SESSION_REPOSITORY_TOKEN,
  TOKEN_SERVICE_TOKEN,
  TOKEN_PAYLOAD_BUILDER_TOKEN,
} from "../../interfaces/auth.tokens.js";
import { TokensRefreshedDomainEvent } from "../../domain/events/tokens-refreshed.domain-event.js";

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  sessionId: string;
  userId: string;
  tenantId: string;
  issuedAt: Date;
  events: TokensRefreshedDomainEvent[];
}

/**
 * @description 刷新令牌应用服务，实现令牌轮换与会话更新
 */
@Injectable()
export class RefreshService extends AuthLoggingService {
  constructor(
    logger: Logger,
    @Inject(AUTH_SESSION_REPOSITORY_TOKEN)
    private readonly sessions: AuthSessionRepository,
    @Inject(TOKEN_SERVICE_TOKEN)
    private readonly tokenService: TokenService,
    @Inject(TOKEN_PAYLOAD_BUILDER_TOKEN)
    private readonly tokenPayloadBuilder: TokenPayloadBuilder,
  ) {
    super(logger);
  }

  public async execute(command: RefreshCommand): Promise<RefreshResult> {
    const refreshToken = command.refreshToken?.trim();
    if (!refreshToken) {
      this.logger.warn("刷新令牌缺失", {});
      throw new GeneralUnauthorizedException("刷新令牌无效或已过期");
    }

    const session = await this.sessions.findByRefreshToken(refreshToken);
    if (!session) {
      this.logger.warn("刷新令牌未匹配任何会话", {});
      throw new GeneralUnauthorizedException("刷新令牌无效或已过期");
    }

    try {
      await session.renewTokens(this.tokenService, this.tokenPayloadBuilder);
    } catch (error) {
      this.logger.warn("刷新令牌轮换失败", {
        sessionId: session.sessionId.value,
        reason: (error as Error).message,
      });
      throw new GeneralUnauthorizedException(
        "刷新令牌无效或已过期",
        undefined,
        error,
      );
    }

    await this.sessions.save(session);

    this.logger.log("刷新令牌成功", {
      sessionId: session.sessionId.value,
      userId: session.userId.value,
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
      events: session
        .pullDomainEvents()
        .filter(
          (event): event is TokensRefreshedDomainEvent =>
            event instanceof TokensRefreshedDomainEvent,
        ),
    };
  }
}
