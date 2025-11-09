import { UserDomainException } from "../exceptions/user-domain.exception.js";
import { ValueObject } from "./value-object.base.js";

const EMAIL_PATTERN =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;

/**
 * @description 邮箱值对象，负责校验格式并统一小写
 */
export class EmailAddress extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * @description 创建邮箱值对象
   * @param raw 原始邮箱字符串
   * @throws UserDomainException 当邮箱为空或格式非法时抛出
   */
  public static create(raw: string): EmailAddress {
    if (!raw || raw.trim().length === 0) {
      throw new UserDomainException("邮箱不能为空");
    }
    const normalized = raw.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new UserDomainException("邮箱格式不正确");
    }
    return new EmailAddress(normalized);
  }

  /**
   * @description 获取邮箱字符串
   */
  public get value(): string {
    return this.unwrap();
  }
}
