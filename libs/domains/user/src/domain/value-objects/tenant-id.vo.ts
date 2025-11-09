import { UserDomainException } from "../exceptions/user-domain.exception.js";
import { ValueObject } from "./value-object.base.js";

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

/**
 * @description 租户标识值对象
 */
export class TenantId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * @description 根据字符串创建租户标识
   * @param raw 原始 UUID 字符串
   * @throws UserDomainException 当格式非法时抛出
   */
  public static fromString(raw: string): TenantId {
    if (!UUID_PATTERN.test(raw)) {
      throw new UserDomainException("租户标识必须是有效的 UUID");
    }
    return new TenantId(raw);
  }

  /**
   * @description 获取租户标识字符串
   */
  public get value(): string {
    return this.unwrap();
  }
}
