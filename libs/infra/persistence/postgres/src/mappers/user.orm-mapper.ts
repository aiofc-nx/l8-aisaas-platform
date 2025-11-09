import {
  DisplayName,
  EmailAddress,
  MobilePhone,
  PlatformAdminId,
  TenantId,
  User,
  UserId,
  UserRole,
  UserStatus,
} from "@hl8/user";
import { UserEntity } from "../entities/user.entity.js";

/**
 * @description 用户聚合与数据库实体之间的转换器
 */
export class UserOrmMapper {
  public static toDomain(entity: UserEntity): User {
    return User.restore({
      id: UserId.fromString(entity.id),
      tenantId: TenantId.fromString(entity.tenantId),
      displayName: DisplayName.create(entity.displayName),
      email: EmailAddress.create(entity.email),
      mobile:
        entity.mobile !== null && entity.mobile !== undefined
          ? MobilePhone.create(entity.mobile)
          : undefined,
      status: entity.status,
      roles: entity.roles.map((role) => role as UserRole),
      createdBy: PlatformAdminId.fromString(entity.createdBy),
      createdAt: entity.createdAt,
    });
  }

  public static toPersistence(aggregate: User): UserEntity {
    const entity = new UserEntity();
    entity.id = aggregate.id.value;
    entity.tenantId = aggregate.tenantId.value;
    entity.displayName = aggregate.displayName.value;
    entity.email = aggregate.email.value;
    entity.mobile = aggregate.mobile?.value ?? null;
    entity.status = aggregate.status;
    entity.roles = aggregate.roles.map((role) => role);
    entity.createdBy = aggregate.createdBy.value;
    entity.createdAt = aggregate.createdAt;
    return entity;
  }
}
