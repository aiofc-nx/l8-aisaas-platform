/**
 * @description 用户领域通用异常，封装领域层校验错误
 */
export class UserDomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserDomainException";
  }
}
