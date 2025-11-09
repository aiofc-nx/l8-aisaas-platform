import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from "class-validator";
import { Transform } from "class-transformer";

/**
 * @description 创建租户用户请求体，封装平台管理员提交的用户基本信息
 * @remarks
 * - DTO 字段保持与领域层 `CreateTenantUserCommand` 一致，便于映射
 */
export class CreateUserDto {
  /**
   * @description 用户显示名称
   */
  @ApiProperty({
    description: "用户显示名称，长度 1~50 字符",
    maxLength: 50,
    example: "张晓明",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString({ message: "用户名称必须是字符串" })
  @IsNotEmpty({ message: "用户名称不能为空" })
  @MaxLength(50, { message: "用户名称长度不得超过 50 个字符" })
  public displayName!: string;

  /**
   * @description 平台范围唯一的邮箱
   */
  @ApiProperty({
    description: "邮箱地址，平台范围唯一，系统自动转小写",
    example: "zhangxm@example.com",
  })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsString({ message: "邮箱必须是字符串" })
  @IsNotEmpty({ message: "邮箱不能为空" })
  @IsEmail({}, { message: "邮箱格式不正确" })
  public email!: string;

  /**
   * @description 可选手机号，用于通知或二次验证
   */
  @ApiProperty({
    description: "中国大陆手机号，可选字段",
    example: "13800138000",
    required: false,
  })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : (value ?? undefined),
  )
  @ValidateIf(
    (_, value) => value !== undefined && value !== null && value !== "",
  )
  @Matches(/^1\d{10}$/, { message: "手机号格式不正确" })
  public mobile?: string | null;

  /**
   * @description 角色数组，默认包含租户管理员
   */
  @ApiProperty({
    description: "角色数组，默认包含租户管理员",
    example: ["tenant-admin"],
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsArray({ message: "角色列表必须是数组" })
  @ArrayNotEmpty({ message: "角色列表不能为空" })
  @IsString({ each: true, message: "角色必须为字符串" })
  public roles?: string[];
}
