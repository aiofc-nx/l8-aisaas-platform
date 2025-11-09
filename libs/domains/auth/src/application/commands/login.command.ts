/**
 * @description 登录命令数据传输对象
 */
export class LoginCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly tenantHint?: string | null,
  ) {}
}
