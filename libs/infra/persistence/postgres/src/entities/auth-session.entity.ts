import { Entity, Enum, Index, Property } from "@mikro-orm/core";
import { AuthSessionStatus } from "@hl8/auth";
import { BasePostgresEntity } from "./base-postgres.entity.js";

/**
 * @description 认证会话实体映射
 */
@Entity({ tableName: "auth_sessions" })
@Index({ properties: ["tenantId", "refreshToken"] })
export class AuthSessionEntity extends BasePostgresEntity {
  @Property({ type: "uuid" })
  tenantId!: string;

  @Property({ type: "uuid" })
  userId!: string;

  @Property({ type: "varchar", length: 512 })
  accessToken!: string;

  @Property({ type: "timestamptz" })
  accessTokenExpiresAt!: Date;

  @Property({ type: "varchar", length: 512 })
  refreshToken!: string;

  @Property({ type: "timestamptz" })
  refreshTokenExpiresAt!: Date;

  @Enum(() => AuthSessionStatus)
  status!: AuthSessionStatus;

  @Property({ type: "timestamptz" })
  issuedAt!: Date;

  @Property({ type: "timestamptz", nullable: true })
  lastRefreshedAt?: Date | null;

  @Property({ type: "json" })
  roles!: string[];

  @Property({ type: "json" })
  permissions!: string[];
}
