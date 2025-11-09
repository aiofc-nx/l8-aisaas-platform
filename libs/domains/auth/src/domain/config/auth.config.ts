import { IsOptional, IsString } from "class-validator";

/**
 * @description 认证配置类，定义 JWT 秘钥、过期时间及 Header 名称
 */
export class AuthConfig {
  /**
   * @description 访问令牌秘钥
   */
  @IsString({ message: "访问令牌秘钥不能为空" })
  public accessTokenSecret!: string;

  /**
   * @description 访问令牌有效期（如 3600s）
   */
  @IsString({ message: "访问令牌有效期必须为字符串" })
  public accessTokenExpiresIn!: string;

  /**
   * @description 刷新令牌秘钥
   */
  @IsString({ message: "刷新令牌秘钥不能为空" })
  public refreshTokenSecret!: string;

  /**
   * @description 刷新令牌有效期（如 7d）
   */
  @IsString({ message: "刷新令牌有效期必须为字符串" })
  public refreshTokenExpiresIn!: string;

  /**
   * @description HTTP 请求中携带访问令牌的 Header 名称
   */
  @IsString({ message: "认证 Header 名称必须为字符串" })
  public authHeaderName: string = "authorization";

  /**
   * @description 多租户场景中租户标识 Header 名称
   */
  @IsString({ message: "租户 Header 名称必须为字符串" })
  @IsOptional()
  public tenantHeaderName: string = "x-tenant-id";
}
