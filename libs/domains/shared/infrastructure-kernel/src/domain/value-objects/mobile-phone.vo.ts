import { UserDomainException } from "../exceptions/user-domain.exception.js";
import { ValueObject } from "./value-object.base.js";

const MOBILE_PATTERN = /^1\d{10}$/;

/**
 * @description 手机号码值对象，遵循中国大陆 11 位号码格式
 */
export class MobilePhone extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * @description 创建手机号值对象
   * @param raw 原始手机号
   * @throws UserDomainException 当格式非法时抛出
   */
  public static create(raw: string): MobilePhone {
    if (!raw) {
      throw new UserDomainException("手机号不能为空");
    }
    const normalized = raw.trim();
    if (!MOBILE_PATTERN.test(normalized)) {
      throw new UserDomainException("手机号格式不正确");
    }
    return new MobilePhone(normalized);
  }

  /**
   * @description 将可选手机号转换为值对象
   * @param raw 可选手机号
   * @returns 值对象或 undefined
   */
  public static fromNullable(raw?: string | null): MobilePhone | undefined {
    if (!raw) {
      return undefined;
    }
    return MobilePhone.create(raw);
  }

  /**
   * @description 获取手机号字符串
   */
  public get value(): string {
    return this.unwrap();
  }
}
