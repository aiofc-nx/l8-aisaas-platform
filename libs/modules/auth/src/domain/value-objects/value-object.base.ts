/**
 * @description 认证模块值对象基类，提供相等性比对
 */
export abstract class ValueObject<T> {
  protected constructor(private readonly internalValue: T) {}

  public unwrap(): T {
    return this.internalValue;
  }

  public equals(other?: ValueObject<T>): boolean {
    if (!other) {
      return false;
    }
    return Object.is(this.internalValue, other.internalValue);
  }

  public toString(): string {
    return String(this.internalValue);
  }
}
