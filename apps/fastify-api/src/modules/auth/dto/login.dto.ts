import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";
import type { LoginResult, RefreshResult } from "@hl8/auth";

/**
 * @description 登录请求 DTO，负责校验平台管理员登录所需的邮箱与密码
 */
export class LoginRequestDto {
  @ApiProperty({
    description: "平台管理员邮箱地址（平台范围唯一）",
    example: "admin@example.com",
  })
  @IsEmail({}, { message: "邮箱格式不正确" })
  public email!: string;

  @ApiProperty({
    description: "登录密码（至少 8 位，建议包含大小写与数字）",
    example: "Admin@123",
  })
  @IsString({ message: "密码不能为空" })
  @MinLength(8, { message: "密码长度至少为 8 位" })
  public password!: string;
}

/**
 * @description 登录响应 DTO，统一封装访问/刷新令牌返回结构
 */
export class LoginResponseDto {
  @ApiProperty({ description: "访问令牌（Bearer Token）" })
  public accessToken!: string;

  @ApiProperty({ description: "刷新令牌，用于后续换取新的访问令牌" })
  public refreshToken!: string;

  @ApiProperty({
    description: "访问令牌有效期（单位：秒）",
    example: 3600,
  })
  public expiresIn!: number;

  @ApiProperty({
    description: "刷新令牌有效期（单位：秒）",
    example: 604800,
  })
  public refreshExpiresIn!: number;

  @ApiProperty({
    description: "令牌类型，默认为 Bearer",
    example: "Bearer",
  })
  public tokenType: string = "Bearer";

  @ApiProperty({
    description: "令牌颁发时间（ISO 8601 格式）",
  })
  public issuedAt!: string;

  public static fromResult(
    result: LoginResult | RefreshResult,
  ): LoginResponseDto {
    const dto = new LoginResponseDto();
    dto.accessToken = result.accessToken;
    dto.refreshToken = result.refreshToken;
    dto.expiresIn = LoginResponseDto.calculateTtlSeconds(
      result.accessTokenExpiresAt,
    );
    dto.refreshExpiresIn = LoginResponseDto.calculateTtlSeconds(
      result.refreshTokenExpiresAt,
    );
    dto.issuedAt = result.issuedAt.toISOString();
    return dto;
  }

  private static calculateTtlSeconds(expiresAt: Date): number {
    const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    return ttl > 0 ? ttl : 0;
  }
}
