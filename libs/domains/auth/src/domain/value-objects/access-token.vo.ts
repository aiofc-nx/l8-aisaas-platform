import { ValueObject } from "./value-object.base.js";

const MAX_TOKEN_BYTES = 7_168;

/**
 * @description 访问令牌值对象，封装令牌字符串与过期时间
 */
export class AccessToken extends ValueObject<string> {
  private constructor(
    value: string,
    public readonly expiresAt: Date,
  ) {
    super(value);
  }

  public static create(raw: string, expiresAt: Date): AccessToken {
    if (!raw || raw.trim().length === 0) {
      throw new Error("访问令牌不能为空");
    }
    const normalized = raw.trim();
    if (Buffer.byteLength(normalized, "utf8") > MAX_TOKEN_BYTES) {
      throw new Error("访问令牌长度超过安全阈值 7KB");
    }
    if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime())) {
      throw new Error("访问令牌的过期时间无效");
    }
    return new AccessToken(normalized, expiresAt);
  }

  public get value(): string {
    return this.unwrap();
  }
}
