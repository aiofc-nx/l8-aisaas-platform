import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

/**
 * @description 事件存储 MongoDB 实体
 */
@Entity({ collection: "domain_events" })
export class DomainEventEntity {
  @PrimaryKey({ type: "string" })
  eventId!: string;

  @Property()
  aggregateId!: string;

  @Property()
  type!: string;

  @Property()
  version!: number;

  @Property({ type: "object" })
  payload!: Record<string, unknown>;

  @Property({ type: "object" })
  metadata!: Record<string, unknown>;

  @Property()
  occurredOn!: Date;
}
