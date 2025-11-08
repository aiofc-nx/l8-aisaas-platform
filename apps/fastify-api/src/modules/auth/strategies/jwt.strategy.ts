import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Logger } from "@hl8/logger";
import { AuthConfig } from "@hl8/auth";
import type { JwtRequestUser } from "../types/jwt-request-user.type.js";

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
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.accessTokenSecret,
      passReqToCallback: false,
    });
  }

  public validate(payload: JwtPayload): JwtRequestUser {
    const userId = payload.uid;
    if (!userId) {
      throw new Error("访问令牌缺少用户标识");
    }

    const user: JwtRequestUser = {
      userId,
      tenantId: payload.tid,
      roles: payload.roles ?? [],
      permissions: payload.permissions ?? [],
      sessionId: payload.sid,
    };

    this.logger.log("JWT 验证成功", {
      userId,
      tenantId: payload.tid,
      sessionId: payload.sid,
      permissions: user.permissions?.length ?? 0,
    });

    return user;
  }
}
