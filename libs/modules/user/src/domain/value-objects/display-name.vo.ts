import { UserDomainException } from "../exceptions/user-domain.exception.js";
import { ValueObject } from "./value-object.base.js";

const MIN_LENGTH = 1;
const MAX_LENGTH = 50;

/**
 * @description 展示名称值对象，限定长度并移除首尾空格
 */
export class DisplayName extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * @description 创建展示名称
   * @param raw 原始名称
   * @throws UserDomainException 当为空或超出长度限制时抛出
   */
  public static create(raw: string): DisplayName {
    if (!raw) {
      throw new UserDomainException("用户名称不能为空");
    }
    const normalized = raw.trim();
    if (normalized.length < MIN_LENGTH || normalized.length > MAX_LENGTH) {
      throw new UserDomainException(
        `用户名称长度必须在 ${MIN_LENGTH}~${MAX_LENGTH} 字之间`,
      );
    }
    return new DisplayName(normalized);
  }

  /**
   * @description 获取展示名称
   */
  public get value(): string {
    return this.unwrap();
  }
}
