import { AccessTokenPayload } from "../domain/value-objects/access-token-payload.vo.js";
import { RefreshTokenPayload } from "../domain/value-objects/refresh-token-payload.vo.js";
import { AccessToken } from "../domain/value-objects/access-token.vo.js";
import { RefreshToken } from "../domain/value-objects/refresh-token.vo.js";

/**
 * @description Token 服务接口，负责签发与解析 JWT
 */
export interface TokenService {
  signAccessToken(payload: AccessTokenPayload): Promise<AccessToken>;

  signRefreshToken(payload: RefreshTokenPayload): Promise<RefreshToken>;
}
