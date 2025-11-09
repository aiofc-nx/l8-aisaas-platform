import { Entity, Enum, Index, Property, Unique } from "@mikro-orm/core";
import { UserStatus } from "@hl8/user";
import { BasePostgresEntity } from "./base-postgres.entity.js";

/**
 * @description 用户表实体映射
 */
@Entity({ tableName: "users" })
@Unique({ properties: ["email"] })
export class UserEntity extends BasePostgresEntity {
  @Index()
  @Property({ type: "uuid" })
  tenantId!: string;

  @Property({ type: "varchar", length: 50 })
  displayName!: string;

  @Property({ type: "varchar", length: 255 })
  email!: string;

  @Property({ type: "varchar", length: 15, nullable: true })
  mobile?: string | null;

  @Enum(() => UserStatus)
  status!: UserStatus;

  @Property({ type: "json" })
  roles!: string[];

  @Property({ type: "uuid" })
  createdBy!: string;

  @Property({ type: "timestamptz" })
  createdAt: Date = new Date();
}
