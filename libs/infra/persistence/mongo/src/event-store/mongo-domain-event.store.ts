import { EntityManager } from "@mikro-orm/mongodb";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable } from "@nestjs/common";
import { DomainEventEntity } from "../entities/domain-event.entity.js";
import type { DomainEventRecord } from "./domain-event.types.js";

/**
 * @description 基于 MikroORM 的 MongoDB 事件存储
 */
@Injectable()
export class MongoDomainEventStore {
  constructor(
    @InjectEntityManager("mongo")
    private readonly em: EntityManager,
  ) {}

  public async append(event: DomainEventRecord): Promise<void> {
    const entity = this.em.create(DomainEventEntity, {
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      type: event.type,
      version: event.version,
      payload: event.payload,
      metadata: event.metadata,
      occurredOn: event.occurredOn,
    });
    await this.em.persistAndFlush(entity);
  }

  public async load(aggregateId: string): Promise<DomainEventRecord[]> {
    const events = await this.em.find(
      DomainEventEntity,
      { aggregateId },
      { orderBy: { occurredOn: "asc" } },
    );
    return events.map((event) => ({
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      type: event.type,
      version: event.version,
      payload: event.payload,
      metadata: event.metadata,
      occurredOn: event.occurredOn,
    }));
  }

  public async clear(aggregateId: string): Promise<void> {
    await this.em.nativeDelete(DomainEventEntity, { aggregateId });
  }
}
