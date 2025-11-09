import { randomUUID } from "node:crypto";
import { UserDomainException } from "../exceptions/user-domain.exception.js";
import { ValueObject } from "./value-object.base.js";

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

/**
 * @description 用户标识值对象，封装 UUID 校验与生成
 */
export class UserId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * @description 生成新的用户标识
   */
  public static generate(): UserId {
    return new UserId(randomUUID());
  }

  /**
   * @description 从已有字符串创建用户标识
   * @param raw 原始 UUID 字符串
   * @throws UserDomainException 当格式非法时抛出
   */
  public static fromString(raw: string): UserId {
    if (!UUID_PATTERN.test(raw)) {
      throw new UserDomainException("用户标识必须是有效的 UUID");
    }
    return new UserId(raw);
  }

  /**
   * @description 获取标识字符串
   */
  public get value(): string {
    return this.unwrap();
  }
}
