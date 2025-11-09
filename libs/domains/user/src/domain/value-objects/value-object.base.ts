/**
 * @description 领域层值对象基类，提供相等性比对与基础序列化能力
 * @typeParam T 原始值类型
 */
export abstract class ValueObject<T> {
  protected constructor(private readonly internalValue: T) {}

  /**
   * @description 获取值对象的原始值
   */
  public unwrap(): T {
    return this.internalValue;
  }

  /**
   * @description 判断两个值对象是否相等
   * @param other 另一个值对象
   * @returns 是否相等
   */
  public equals(other?: ValueObject<T>): boolean {
    if (!other) {
      return false;
    }
    return Object.is(this.internalValue, other.internalValue);
  }

  /**
   * @description 转换为字符串
   */
  public toString(): string {
    return String(this.internalValue);
  }
}
