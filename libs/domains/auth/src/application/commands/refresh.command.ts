/**
 * @description 刷新令牌命令
 */
export class RefreshCommand {
  constructor(public readonly refreshToken: string) {}
}
