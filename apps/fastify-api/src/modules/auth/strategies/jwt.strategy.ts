import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Logger } from "@hl8/logger";
import { AuthConfig } from "@hl8/auth";
import type { JwtRequestUser } from "../types/jwt-request-user.type.js";
import { TenantContextExecutor } from "@hl8/multi-tenancy";
import { GeneralUnauthorizedException } from "@hl8/exceptions";

interface JwtPayload {
  sid?: string;
  uid?: string;
  tid?: string;
  roles?: string[];
  permissions?: string[];
  iat?: number;
  exp?: number;
}

/**
 * @description 负责解析访问令牌的 JWT 策略，成功后返回请求用户上下文
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: AuthConfig,
    private readonly logger: Logger,
    private readonly tenantContextExecutor: TenantContextExecutor,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.accessTokenSecret,
      passReqToCallback: false,
    });
  }

  public async validate(payload: JwtPayload): Promise<JwtRequestUser> {
    const userId = payload.uid;
    const tenantId = payload.tid;

    if (!userId || !tenantId) {
      this.logger.warn("访问令牌缺少关键字段", {
        hasUserId: Boolean(userId),
        hasTenantId: Boolean(tenantId),
      });
      throw new GeneralUnauthorizedException("登录凭证无效");
    }

    const user: JwtRequestUser = {
      userId,
      tenantId,
      roles: payload.roles ?? [],
      permissions: payload.permissions ?? [],
      sessionId: payload.sid,
    };

    return this.tenantContextExecutor.runWithTenantContext(
      tenantId,
      async () => {
        this.logger.log("JWT 验证成功", {
          userId,
          tenantId,
          sessionId: payload.sid,
          permissions: user.permissions?.length ?? 0,
        });
        return user;
      },
      {
        userId,
      },
    );
  }
}
