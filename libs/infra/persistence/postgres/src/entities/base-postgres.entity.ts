import { PrimaryKey, Property } from "@mikro-orm/core";

/**
 * @description PostgreSQL 实体基类，统一处理主键与审计字段
 */
export abstract class BasePostgresEntity {
  @PrimaryKey({ type: "uuid" })
  id!: string;

  @Property({ type: "timestamptz" })
  createdAt: Date = new Date();

  @Property({ type: "timestamptz", onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
