import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

/**
 * @description 缓存失效请求 DTO，用于执行延迟双删策略。
 */
export class InvalidateCacheDto {
  /** @description 业务域标识 */
  @IsString({ message: "domain 必须为字符串" })
  readonly domain!: string;

  /** @description 租户标识 */
  @IsString({ message: "tenantId 必须为字符串" })
  readonly tenantId!: string;

  /** @description 待失效的缓存键集合 */
  @IsArray({ message: "keys 必须为字符串数组" })
  @ArrayMinSize(1, { message: "至少提供一个缓存键" })
  readonly keys!: string[];

  /** @description 触发失效的中文原因 */
  @IsString({ message: "reason 必须为字符串" })
  readonly reason!: string;

  /** @description 指定客户端键，默认使用配置中的客户端 */
  @IsOptional()
  @IsString({ message: "clientKey 必须为字符串" })
  readonly clientKey?: string;

  /** @description 覆盖默认延迟时间（毫秒） */
  @IsOptional()
  @IsInt({ message: "delayMs 必须为整数" })
  @Min(0, { message: "delayMs 不能小于 0" })
  readonly delayMs?: number;

  /** @description 覆盖默认锁超时时间（毫秒） */
  @IsOptional()
  @IsInt({ message: "lockDurationMs 必须为整数" })
  @Min(0, { message: "lockDurationMs 不能小于 0" })
  readonly lockDurationMs?: number;

  /** @description 是否发送失效通知，默认启用 */
  @IsOptional()
  @IsBoolean({ message: "notify 必须为布尔值" })
  readonly notify?: boolean;
}
