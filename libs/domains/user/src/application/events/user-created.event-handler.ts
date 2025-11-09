import { randomUUID } from "node:crypto";
import { EventsHandler, type IEventHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { Logger } from "@hl8/logger";
import { MongoDomainEventStore } from "@hl8/persistence-mongo";
import { TenantContextExecutor } from "@hl8/multi-tenancy";
import {
  USER_PROJECTION_REPOSITORY,
  type UserProjectionRepository,
} from "../../interfaces/user-projection.repository.js";
import { UserCreatedDomainEvent } from "../../domain/events/user-created.domain-event.js";

/**
 * @description 用户创建事件处理器，负责写入事件存储并刷新读模型
 */
@EventsHandler(UserCreatedDomainEvent)
export class UserCreatedEventHandler
  implements IEventHandler<UserCreatedDomainEvent>
{
  constructor(
    private readonly eventStore: MongoDomainEventStore,
    @Inject(USER_PROJECTION_REPOSITORY)
    private readonly projectionRepository: UserProjectionRepository,
    private readonly tenantContextExecutor: TenantContextExecutor,
    private readonly logger: Logger,
  ) {}

  public async handle(event: UserCreatedDomainEvent): Promise<void> {
    await this.eventStore.append({
      eventId: randomUUID(),
      aggregateId: event.userId.value,
      type: "UserCreatedDomainEvent",
      version: 1,
      payload: event.toJSON(),
      metadata: {
        tenantId: event.tenantId.value,
        createdBy: event.createdBy.value,
      },
      occurredOn: event.occurredAt,
    });

    await this.tenantContextExecutor.runWithTenantContext(
      event.tenantId.value,
      async () => {
        await this.projectionRepository.upsert({
          id: event.userId.value,
          tenantId: event.tenantId.value,
          displayName: event.displayName.value,
          email: event.email.value,
          status: event.status,
          roles: event.roles,
          createdAt: event.occurredAt,
          updatedAt: event.occurredAt,
        });
      },
    );

    this.logger.log("用户创建事件已写入事件存储并刷新读模型", {
      userId: event.userId.value,
      tenantId: event.tenantId.value,
    });
  }
}
