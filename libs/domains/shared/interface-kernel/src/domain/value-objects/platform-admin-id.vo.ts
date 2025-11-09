import { UserDomainException } from "../exceptions/user-domain.exception.js";
import { ValueObject } from "./value-object.base.js";

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

/**
 * @description 平台管理员标识值对象，用于记录操作来源
 */
export class PlatformAdminId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * @description 根据字符串创建平台管理员标识
   * @param raw 原始 UUID 字符串
   * @throws UserDomainException 当格式非法时抛出
   */
  public static fromString(raw: string): PlatformAdminId {
    if (!UUID_PATTERN.test(raw)) {
      throw new UserDomainException("平台管理员标识必须是有效的 UUID");
    }
    return new PlatformAdminId(raw);
  }

  /**
   * @description 获取标识字符串
   */
  public get value(): string {
    return this.unwrap();
  }
}
