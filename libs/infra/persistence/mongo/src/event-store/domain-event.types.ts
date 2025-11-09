/**
 * @description 领域事件通用模型
 */
export interface DomainEventRecord {
  eventId: string;
  aggregateId: string;
  type: string;
  version: number;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  occurredOn: Date;
}
