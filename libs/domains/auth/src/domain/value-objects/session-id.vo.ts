import { randomUUID } from "node:crypto";
import { ValueObject } from "./value-object.base.js";

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

/**
 * @description 会话标识值对象
 */
export class SessionId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  public static generate(): SessionId {
    return new SessionId(randomUUID());
  }

  public static fromString(raw: string): SessionId {
    if (!UUID_PATTERN.test(raw)) {
      throw new Error("会话标识必须是有效的 UUID");
    }
    return new SessionId(raw);
  }

  public get value(): string {
    return this.unwrap();
  }
}
