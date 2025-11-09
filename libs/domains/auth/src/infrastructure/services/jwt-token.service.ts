import { Logger } from "@hl8/logger";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { AuthConfig } from "../../domain/config/auth.config.js";
import { AccessTokenPayload } from "../../domain/value-objects/access-token-payload.vo.js";
import { RefreshTokenPayload } from "../../domain/value-objects/refresh-token-payload.vo.js";
import { AccessToken } from "../../domain/value-objects/access-token.vo.js";
import { RefreshToken } from "../../domain/value-objects/refresh-token.vo.js";
import { TokenService } from "../../interfaces/token.service.js";

const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const DURATION_REGEX = /^(\d+)(s|m|h|d)$/i;

function parseDurationToSeconds(raw: string, field: string): number {
  const match = raw.match(DURATION_REGEX);
  if (!match) {
    throw new Error(`${field} 配置格式不正确，应使用 3600s/15m/12h/7d 等形式`);
  }

  const amount = Number.parseInt(match[1] ?? "0", 10);
  const unit = match[2]?.toLowerCase();

  if (Number.isNaN(amount) || amount <= 0) {
    throw new Error(`${field} 配置的数值必须大于 0`);
  }

  switch (unit) {
    case "s":
      return amount * SECOND;
    case "m":
      return amount * MINUTE;
    case "h":
      return amount * HOUR;
    case "d":
      return amount * DAY;
    default:
      throw new Error(`${field} 配置的时间单位仅支持 s/m/h/d`);
  }
}

/**
 * @description 使用 JSON Web Token 生成访问令牌与刷新令牌的服务
 */
export class JwtTokenService implements TokenService {
  private readonly accessTokenTtlSeconds: number;

  private readonly refreshTokenTtlSeconds: number;

  constructor(
    private readonly config: AuthConfig,
    private readonly logger: Logger,
    private readonly clock: () => Date = () => new Date(),
  ) {
    this.accessTokenTtlSeconds = parseDurationToSeconds(
      config.accessTokenExpiresIn,
      "访问令牌有效期",
    );
    this.refreshTokenTtlSeconds = parseDurationToSeconds(
      config.refreshTokenExpiresIn,
      "刷新令牌有效期",
    );
  }

  public async signAccessToken(
    payload: AccessTokenPayload,
  ): Promise<AccessToken> {
    const now = this.clock();
    const expiresAt = new Date(
      now.getTime() + this.accessTokenTtlSeconds * 1000,
    );
    const token = this.signJwt(
      payload.toJSON(),
      this.config.accessTokenSecret,
      this.accessTokenTtlSeconds,
      "access",
    );

    return AccessToken.create(token, expiresAt);
  }

  public async signRefreshToken(
    payload: RefreshTokenPayload,
  ): Promise<RefreshToken> {
    const now = this.clock();
    const expiresAt = new Date(
      now.getTime() + this.refreshTokenTtlSeconds * 1000,
    );
    const token = this.signJwt(
      payload.toJSON(),
      this.config.refreshTokenSecret,
      this.refreshTokenTtlSeconds,
      "refresh",
    );

    return RefreshToken.create(token, expiresAt);
  }

  private signJwt(
    payload: Record<string, unknown>,
    secret: string,
    expiresInSeconds: number,
    tokenType: "access" | "refresh",
  ): string {
    try {
      const options: SignOptions = {
        expiresIn: expiresInSeconds,
        algorithm: "HS256",
        jwtid: randomUUID(),
      };
      const token = jwt.sign(payload, secret, options);

      this.logger.log("令牌生成成功", {
        tokenType,
        expiresIn: expiresInSeconds,
      });

      return token;
    } catch (error) {
      this.logger.error(`签发 ${tokenType} 令牌失败`, undefined, {
        error,
      });
      throw error;
    }
  }
}
