import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
} from "class-validator";

/**
 * @description 缓存预热请求 DTO。
 */
export class PrefetchRequestDto {
  /** @description 业务域标识 */
  @IsString({ message: "domain 必须为字符串" })
  readonly domain!: string;

  /** @description 租户标识 */
  @IsString({ message: "tenantId 必须为字符串" })
  readonly tenantId!: string;

  /** @description 需要预热的缓存键 */
  @IsArray({ message: "keys 必须为字符串数组" })
  @ArrayMinSize(1, { message: "至少提供一个缓存键" })
  readonly keys!: string[];

  /** @description 是否跳过锁控制 */
  @IsOptional()
  @IsBoolean({ message: "bypassLock 必须为布尔值" })
  readonly bypassLock?: boolean;
}
