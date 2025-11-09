import { Entity, Index, Property, Unique } from "@mikro-orm/core";
import { UserStatus } from "@hl8/user";
import { BasePostgresEntity } from "./base-postgres.entity.js";

/**
 * @description 用户读模型实体
 */
@Entity({ tableName: "user_projections" })
@Unique({ properties: ["tenantId", "email"] })
@Index({ properties: ["tenantId", "createdAt"] })
export class UserProjectionEntity extends BasePostgresEntity {
  @Property({ type: "uuid" })
  tenantId!: string;

  @Property({ type: "varchar", length: 50 })
  displayName!: string;

  @Property({ type: "varchar", length: 255 })
  email!: string;

  @Property({ type: "json" })
  roles!: string[];

  @Property({ type: "varchar", length: 20 })
  status!: UserStatus;
}
