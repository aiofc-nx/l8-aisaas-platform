import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

/**
 * @description 刷新令牌请求 DTO
 */
export class RefreshRequestDto {
  @ApiProperty({
    description: "刷新令牌（来自登录响应）",
  })
  @IsString({ message: "刷新令牌不能为空" })
  @MinLength(10, { message: "刷新令牌长度不合法" })
  public refreshToken!: string;
}
