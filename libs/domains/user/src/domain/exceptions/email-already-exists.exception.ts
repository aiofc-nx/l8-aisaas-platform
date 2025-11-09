import { UserDomainException } from "./user-domain.exception.js";

/**
 * @description 邮箱重复异常，表示平台范围内已存在该邮箱
 */
export class EmailAlreadyExistsException extends UserDomainException {
  constructor(email: string) {
    super(`邮箱 ${email} 已被占用`);
  }
}
