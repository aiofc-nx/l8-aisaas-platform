import { ValueObject } from "./value-object.base.js";

const MAX_TOKEN_BYTES = 7_168;

/**
 * @description 刷新令牌值对象
 */
export class RefreshToken extends ValueObject<string> {
  private constructor(
    value: string,
    public readonly expiresAt: Date,
  ) {
    super(value);
  }

  public static create(raw: string, expiresAt: Date): RefreshToken {
    if (!raw || raw.trim().length === 0) {
      throw new Error("刷新令牌不能为空");
    }
    const normalized = raw.trim();
    if (Buffer.byteLength(normalized, "utf8") > MAX_TOKEN_BYTES) {
      throw new Error("刷新令牌长度超过安全阈值 7KB");
    }
    if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime())) {
      throw new Error("刷新令牌的过期时间无效");
    }
    return new RefreshToken(normalized, expiresAt);
  }

  public rotate(newRaw: string, newExpiresAt: Date): RefreshToken {
    return RefreshToken.create(newRaw, newExpiresAt);
  }

  public get value(): string {
    return this.unwrap();
  }
}
